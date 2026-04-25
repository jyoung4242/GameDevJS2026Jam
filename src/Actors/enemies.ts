import { Actor, Collider, CollisionContact, CollisionType, Color, Engine, Graph, PositionNode, Side, Vector } from "excalibur";
import { GameField } from "./GameField";
import { TowerDestroyedEvent, TowerManager } from "../Lib/TowerManager";
import { enemyBurstColliderGroup, enemyColliderGroup } from "../CollisionGroups";
import { Tower } from "./towers";
import { EnemyTypes, EnemyWaveController } from "../Lib/enemyWaveController";
import { LootComponent, Rarity } from "../Components/LootComponent";
import { BurstShells, DroneEngine, LaserOptics, MissleChassis, PowerCell, PowerCore, Servos } from "./Loot";
import { PositionNodeData } from "../Lib/mapGeneration";
import { ExFSM } from "../Lib/exFSM";
import {
  ApproachingTower,
  AttackingTower,
  FindingTargetTower,
  IdleState,
  FindingTargetSegment,
  AttackingSegment,
  ApproachingSegment,
  FastIdleState,
} from "../statemachines/enemyFSM";
import { CableSegment } from "../Lib/powerChainsLib";
import { AttackSegment, FindClosestSegment } from "../Actions/enemyActions";

export abstract class Enemy extends Actor {
  fsm: ExFSM;
  enemyType: EnemyTypes | null = null;
  waveManager: EnemyWaveController;
  gameField: GameField;
  towerManager: TowerManager;
  navmap: Graph<PositionNodeData>;
  targetTower: Tower | null = null;
  nodePath: PositionNode<PositionNodeData>[] = [];
  hp: number = 1;
  hpMax: number = 1;
  strength: number = 1;
  speed: number = 1;
  // bt: BehaviorTreeComponent | null = null;
  range: number = 1;

  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    navmap: Graph<PositionNodeData>,
    shape: "circle" | "box" = "box",
  ) {
    let args =
      shape === "circle"
        ? { pos, radius: 16, color: Color.Transparent, CollisionGroup: enemyColliderGroup, CollisionType: CollisionType.Passive }
        : {
            pos,
            width: 32,
            height: 32,
            color: Color.Transparent,
            CollisionGroup: enemyColliderGroup,
            CollisionType: CollisionType.Passive,
          };
    super(args);
    this.navmap = navmap;
    this.waveManager = waveManager;
    this.gameField = gamefield;
    this.towerManager = TowerManager;
    this.fsm = new ExFSM();
  }

  resetEnemy() {
    this.hp = this.hpMax;
    this.actions.clearActions();
    this.graphics.current!.tint = Color.White;
  }

  onInitialize(engine: Engine): void {
    // this.on("actioncomplete", this.actionHandler);
    this.towerManager.towerEmitter.on("towerDestroyed", e => this.towerDiedHandler(e));
    this.addComponent(
      new LootComponent({
        scatterRadius: 32,
        entries: [
          { factory: () => new MissleChassis(), weight: 3, rarity: Rarity.Uncommon },
          { factory: () => new BurstShells(), weight: 3, rarity: Rarity.Uncommon },
          { factory: () => new DroneEngine(), weight: 3, rarity: Rarity.Uncommon },
          { factory: () => new LaserOptics(), weight: 3, rarity: Rarity.Uncommon },
          { factory: () => new PowerCore(), weight: 20, rarity: Rarity.Common },
          { factory: () => new PowerCell(), weight: 20, rarity: Rarity.Common },
          { factory: () => new Servos(), weight: 20, rarity: Rarity.Common },
        ],
      }),
    );
  }

  towerDiedHandler = (e: TowerDestroyedEvent) => {
    if (this.targetTower === e.tower) {
      this.targetTower = null;
    }
  };

  takeDamage(damageAmount: number) {
    this.hp -= damageAmount;
    if (this.hp <= 0) {
      this.get(LootComponent).dropOne(this.gameField, this.pos);
      this.waveManager.returnEnemyToPool(this);
    }
  }

  targetRangeCheck() {
    // console.log("targetRange", this.targetTower!.pos.distance(this.pos), this.range);

    if (!this.targetTower) return false;
    //return false if out of range, return true if it is less than range
    return this.targetTower.pos.distance(this.pos) < this.range;
  }

  targetCheck() {
    // console.log("target tower", this.targetTower);
    return this.targetTower != null;
  }

  getGraphNode(pos: Vector): PositionNode<PositionNodeData> | null {
    let clostestDistance = Infinity;
    let closestNode: PositionNode<PositionNodeData> | null = null;

    for (const node of this.navmap.nodes) {
      //@ts-ignore
      let testNode: PositionNode<PositionNodeData> = node[1];
      let distance = testNode.data.pos.distance(pos);
      if (distance < clostestDistance) {
        clostestDistance = distance;
        closestNode = testNode;
      }
    }
    return closestNode;
  }

  onPreUpdate(engine: Engine, elapsed: number): void {}
}

export class TankEnemy extends Enemy {
  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    navmap: Graph<PositionNodeData>,
  ) {
    super(waveManager, gamefield, TowerManager, pos, navmap, "box");
    this.enemyType = "tank";
    this.graphics.color = Color.Red;
    this.speed = 80; //10
    this.strength = 5;
    this.hp = 25;
    this.hpMax = 25;
    this.range = 80;

    this.fsm.register(new IdleState(this), new FindingTargetTower(this), new AttackingTower(this, 100), new ApproachingTower(this));
  }

  onInitialize(engine: Engine): void {
    super.onInitialize(engine);
    // this.bt = createBehaviorTree(this, "Selector")
    //   .sequence("Has Target Tower")
    //   .condition("Target Exists and Alive", () => this.targetCheck())
    //   .selector("Has Target within Melee Range")
    //   .sequence("In Attack Range")
    //   .condition("In Range?", () => this.targetRangeCheck())
    //   .action("MeleeAttackTower", new MeleeAttackAction(this, 3000))
    //   .end()
    //   .action("Move closer to tower", new MoveCloserToTower(this, this.speed))
    //   .end()
    //   .end()
    //   .action("Find Nearest Tower Action", new FindClosestTower(this.scene!, this))
    //   .build();
    // this.addComponent(this.bt);
  }

  onAdd(engine: Engine): void {
    this.fsm.set("Idle");
    this.nodePath = [];
  }
  onRemove(engine: Engine): void {
    // this.bt?.reset();
    this.graphics.material = null;
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.fsm.update();
  }
}
export class RangedEnemy extends Enemy {
  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    navmap: Graph<PositionNodeData>,
  ) {
    super(waveManager, gamefield, TowerManager, pos, navmap, "circle");
    this.graphics.color = Color.Blue;
    this.enemyType = "ranged";
    this.speed = 80; //30
    this.strength = 5;
    this.hp = 8;
    this.hpMax = 8;
    this.range = 300;

    this.fsm.register(new IdleState(this), new FindingTargetTower(this), new AttackingTower(this, 100), new ApproachingTower(this));
  }
  onInitialize(engine: Engine): void {
    super.onInitialize(engine);
    // this.bt = createBehaviorTree(this, "Selector")
    //   .sequence("Has Target Tower")
    //   .condition("Target Exists and Alive", () => this.targetCheck())
    //   .selector("Has Target within Attack Range")
    //   .sequence("In Attack Range")
    //   .condition("In Range?", () => this.targetRangeCheck())
    //   .action("RangeAttackTower", new RangedAttackAction(this, 1250))
    //   .end()
    //   .action("Move closer to tower", new MoveCloserToTower(this, this.speed))
    //   .end()
    //   .end()
    //   .action("Find Nearest Tower Action", new FindClosestTower(this.scene!, this))
    //   .build();
    // this.addComponent(this.bt);
  }

  onAdd(engine: Engine): void {
    this.nodePath = [];
    this.fsm.set("Idle");
  }

  onRemove(engine: Engine): void {
    // this.bt?.reset();
    this.graphics.material = null;
  }

  fireWeapon(target: Tower) {
    let burst = this.waveManager.gameField.addChild(new EnemyBurst(this, target));
    //reset burst position to tower position
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.fsm.update();
  }
}
export class FastEnemy extends Enemy {
  targetSegment: CableSegment | null = null;
  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    navmap: Graph<PositionNodeData>,
  ) {
    super(waveManager, gamefield, TowerManager, pos, navmap, "circle");
    this.graphics.color = Color.Green;
    this.enemyType = "fast";
    this.speed = 100; //75
    this.strength = 2;
    this.hp = 5;
    this.hpMax = 5;
    this.range = 75;
  }

  onInitialize(engine: Engine): void {
    super.onInitialize(engine);
    this.fsm.register(
      new FastIdleState(this),
      new FindingTargetSegment(this),
      new AttackingSegment(this, 100),
      new ApproachingSegment(this),
    );
  }

  onAdd(engine: Engine): void {
    this.nodePath = [];
    console.log("fast onAdd");

    this.fsm.set("FastIdle");
  }

  findNearestSegment() {
    let nearest = null,
      minDist = Infinity;
    for (const actor of this.scene!.actors) {
      if (!(actor instanceof CableSegment) || !actor.isAlive) continue;
      const d = this.pos.distance(actor.pos);
      if (d < minDist) {
        minDist = d;
        nearest = actor;
      }
    }
    return nearest;
  }

  targetRangeCheckSegment() {
    if (!this.targetSegment) return false;
    //return false if out of range, return true if it is less than range
    return this.targetSegment.pos.distance(this.pos) < this.range;
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    super.onPreUpdate(engine, elapsed);
    this.fsm.update();
  }
}

export class EnemyBurst extends Actor {
  strength: number = 1;
  target: Tower;
  speed: number = 750;
  owner: RangedEnemy;
  constructor(owner: RangedEnemy, target: Tower) {
    super({
      pos: owner.pos,
      radius: 6,
      color: Color.fromHex("#9b8914"),
      collisionGroup: enemyBurstColliderGroup,
      collisionType: CollisionType.Passive,
      z: 1,
    });
    this.owner = owner;
    this.target = target;
  }

  onAdd(engine: Engine): void {
    if (!this.target) {
      this.kill();
    }
    let direction = this.owner.pos.sub(this.target.pos).normalize().negate();
    // this.actions.meet(this.target, this.speed);
    this.vel = direction.scale(this.speed);
  }

  onRemove(engine: Engine): void {}

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Tower) {
      let tower = other.owner as Tower;
      tower.takeDamage(this.strength);
      this.kill();
    }
  }
}
