import { Actor, Collider, CollisionContact, CollisionType, Color, Engine, Side, toRadians, vec, Vector } from "excalibur";
import { EnemyWaveController, WeoponTypes } from "../Lib/enemyWaveController";
import { GameField } from "./GameField";
import { TowerManager } from "../Lib/TowerManager";
import { Enemy } from "./enemies";
import { weaponColliderGroup } from "../CollisionGroups";
import { BehaviorTreeComponent, createBehaviorTree } from "../Components/BehaviorTree";
import { ApproachEnemy, FindEnemy, FireWeapon, Hover } from "../Actions/droneActions";

export class TowerWeapon extends Actor {
  type: WeoponTypes | undefined;
  tm: TowerManager;
  ewc: EnemyWaveController;
  gf: GameField;
  strength: number = 1;

  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    dims: Vector,
    anchor: Vector = Vector.Half,
  ) {
    super({
      pos,
      color: Color.Transparent,
      width: dims.x,
      height: dims.y,
      collisionType: CollisionType.Passive,
      collisionGroup: weaponColliderGroup,
      anchor,
    });
    this.tm = TowerManager;
    this.ewc = waveManager;
    this.gf = gamefield;
  }

  set Strength(strength: number) {
    this.strength = strength;
  }
}

export class TowerBurst extends TowerWeapon {
  speed: number = 200;
  _direction: Vector = new Vector(0, 0);
  lifespan: number = 2000;

  type: WeoponTypes = "burst";
  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, vec(8, 8));
    this.graphics.color = Color.White;
    this.tm = TowerManager;
    this.ewc = waveManager;
    this.gf = gamefield;
  }

  set direction(direction: Vector) {
    this._direction = direction.normalize();
  }

  set position(pos: Vector) {
    this.pos = pos;
  }

  onAdd(engine: Engine): void {
    this.vel = this._direction.scale(this.speed);
    this.lifespan = 2000;
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Enemy) {
      let enemy = other.owner as Enemy;
      enemy.takeDamage(this.strength);
      this.ewc.returnWeaponToPool(this);
    }
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.lifespan -= elapsed;
    if (this.lifespan <= 0) {
      //return to pool
      this.ewc.returnWeaponToPool(this);
    }

    //if no longer contained by gamefield
    if (!this.gf.contains(this.pos.x, this.pos.y)) {
      this.ewc.returnWeaponToPool(this);
    }
  }
}

export class Missle extends TowerWeapon {
  direction: Vector = new Vector(0, 0);
  maxVelocity: number = 250;
  target: Enemy | undefined;
  lifespan: number = 2000;
  type: WeoponTypes = "missle";
  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, vec(24, 9));
    this.graphics.color = Color.Black;
    this.tm = TowerManager;
    this.ewc = waveManager;
    this.gf = gamefield;
  }

  onRemove(engine: Engine): void {
    this.actions.clearActions();
  }

  onAdd(engine: Engine): void {
    this.lifespan = 2000;
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Enemy) {
      let enemy = other.owner as Enemy;
      enemy.takeDamage(this.strength);
      this.ewc.returnWeaponToPool(this);
    }
  }

  setTarget(target: Enemy) {
    this.target = target;
    this.actions.meet(this.target, this.maxVelocity);
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.lifespan -= elapsed;
    if (this.lifespan <= 0) {
      //return to pool
      this.ewc.returnWeaponToPool(this);
    }

    this.rotation = Math.atan2(this.target!.pos.y - this.pos.y, this.target!.pos.x - this.pos.x);

    //check if target still is child of game field, if not return to pool
    if (this.gf.children.find(e => e === this.target) === undefined) this.ewc.returnWeaponToPool(this);
  }
}

export class LaserBeam extends TowerWeapon {
  type: WeoponTypes = "beam";
  lifespan: number = 3000;
  sweepAngle: number = 0;
  direction: Vector = new Vector(0, 0);
  angStep: number = 0;

  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, vec(300, 5), Vector.Zero);
    this.graphics.color = Color.Chartreuse;
    this.tm = TowerManager;
    this.ewc = waveManager;
    this.gf = gamefield;
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Enemy) {
      let enemy = other.owner as Enemy;
      enemy.takeDamage(this.strength);
    }
  }

  setDuration(duration: number) {
    this.lifespan = duration;
  }

  setDirection(direction: Vector) {
    this.direction = direction.normalize();
  }

  setSweepAngle(sweepAngle: number) {
    this.sweepAngle = sweepAngle;
  }

  onAdd(engine: Engine): void {
    this.anchor = Vector.Zero;
    //using direction and sweepAngle, adjust position and rotation of laser beam
    this.rotation = Math.atan2(this.direction.y, this.direction.x) - this.sweepAngle / 2;
    this.angStep = this.sweepAngle / this.lifespan;
  }

  onRemove(engine: Engine): void {}

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.lifespan -= elapsed;
    if (this.lifespan <= 0) {
      //return to pool
      this.ewc.returnWeaponToPool(this);
    }
    this.rotation += this.angStep * elapsed;
  }
}

export class TowerDrone extends TowerWeapon {
  type: WeoponTypes = "drone";
  lifespan: number = 10000;
  bt: BehaviorTreeComponent;
  target: Enemy | null = null;
  isEnabled: boolean = false;

  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, vec(20, 20), Vector.Zero);
    this.graphics.color = Color.DarkGray;
    this.tm = TowerManager;
    this.ewc = waveManager;
    this.gf = gamefield;
    //prettier-ignore
    this.bt = createBehaviorTree(this, "Sequence")
      .condition("IsEnabled", () => this.isDroneEnabled())
      .selector("Attack or Hover")
        .sequence("Attack")
          .condition("Enemy in Range", () => findEnemy(this.ewc, this, 300))
          .action("Find enemy", new FindEnemy(this.ewc, this))
          .action("Approach Enemy", new ApproachEnemy(this, 50, 200))
          .action("Fire Weapon", new FireWeapon(this,  1000))
        .end()
        .sequence("Hover")
          .action("Hover", new Hover(this, 1000))
        .end()
      .end()
      .build();
    this.addComponent(this.bt);
  }

  isDroneEnabled(): boolean {
    return this.isEnabled;
  }

  onAdd(engine: Engine): void {
    this.lifespan = 10000;
  }

  fireWeapon(target: Actor) {
    //rent burst from ewc
    let burst = this.ewc.spawnWeapon("burst") as TowerBurst;
    //reset burst position to tower position
    burst.pos = this.pos;
    if (!target || !burst) {
      //bail on firing
      this.ewc.returnWeaponToPool(this);
      return;
    }
    burst.direction = target.pos.sub(burst.pos).normalize();
    burst.strength = 1;
    if (burst.parent) {
      burst.parent.removeChild(burst);
    }
    this.ewc.gameField.addChild(burst);
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Enemy) {
      this.ewc.returnWeaponToPool(this);
    }
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.lifespan -= elapsed;
    if (this.lifespan <= 0) {
      //return to pool
      this.isEnabled = false;
      this.ewc.returnWeaponToPool(this);
    }

    //if no longer contained by gamefield
    if (!this.gf.contains(this.pos.x, this.pos.y)) {
      this.ewc.returnWeaponToPool(this);
    }
  }
}

function findEnemy(ewc: EnemyWaveController, self: Actor, range: number): boolean {
  let enemies = ewc.gameField.children.filter(e => e instanceof Enemy);
  let closestDistance = Infinity;
  for (const enemy of enemies) {
    let distance = enemy.pos.distance(self.pos);
    if (distance < closestDistance) {
      closestDistance = distance;
    }
  }

  if (closestDistance < range) return true;
  return false;
}
