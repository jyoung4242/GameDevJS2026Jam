import { Action, Actor, Entity, nextActionId } from "excalibur";
import { TowerDrone } from "../Actors/SkillActors";
import { EnemyWaveController } from "../Lib/enemyWaveController";
import { Enemy } from "../Actors/enemies";
import { Tower } from "../Actors/towers";

export class ApproachEnemy implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;
  target: Enemy | null = null;

  constructor(
    public owner: Actor,
    public speed: number,
    public range: number,
  ) {}

  update(elapsed: number): void {
    // start of action

    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
      this.target = (this.owner as TowerDrone).target;
    }

    // in progress set velocity towards the target
    if (this.isRunning) {
      if (!this.target) return;
      let direction = this.owner.pos.sub(this.target!.pos).normalize().negate();
      this.owner.vel = direction.scale(this.speed);
    }

    // end of action
    if (this.isComplete(this.owner)) this.stop();
  }

  isComplete(entity: Entity): boolean {
    if (!this.target) return false;
    return this.owner.pos.distance(this.target!.pos) < this.range;
  }

  reset(): void {
    this.isStarted = false;
  }

  stop(): void {
    this.isRunning = false;
  }
}

export class FireWeapon implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;
  cooldownTimer: number = 0;
  target: Enemy | null = null;

  constructor(
    public owner: Actor,
    public cooldown: number,
  ) {}

  update(elapsed: number): void {
    // start of action

    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
      this.target = (this.owner as TowerDrone).target;
      // Fire Weapon

      (this.owner as TowerDrone).fireWeapon(this.target!);
    }

    // in progress set velocity towards the target
    if (this.isRunning) {
      this.cooldownTimer += elapsed;
    }

    // end of action
    if (this.isComplete(this.owner)) this.stop();
  }

  isComplete(entity: Entity): boolean {
    return this.cooldownTimer > this.cooldown;
  }

  reset(): void {
    this.isStarted = false;
    this.isRunning = false;
    this.cooldownTimer = 0;
  }

  stop(): void {}
}

export class Hover implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;

  constructor(
    public owner: Actor,
    public delaytime: number,
  ) {}

  update(elapsed: number): void {
    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
    }

    if (this.isRunning) this.delaytime -= elapsed;

    if (this.isComplete(this.owner)) this.stop();
  }

  isComplete(entity: Entity): boolean {
    return this.delaytime <= 0;
  }

  reset(): void {
    this.isStarted = false;
    this.isRunning = false;
  }

  stop(): void {
    this.isRunning = false;
  }
}

export class FindEnemy implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;

  constructor(
    public ewc: EnemyWaveController,
    public self: TowerDrone,
  ) {}

  update(elapsed: number): void {
    if (!this.isStarted) {
      this.isStarted = true;
      this.self.target = this.findClosestEnemy();
    }
  }

  isComplete(entity: Entity): boolean {
    return this.self.target instanceof Enemy;
  }

  findClosestEnemy(): Enemy | null {
    let enemies = this.ewc.gameField.children.filter(e => e instanceof Enemy);
    let closestEnemy = null;
    let closestDistance = Infinity;
    for (const enemy of enemies) {
      let distance = enemy.pos.distance(this.self.pos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  reset(): void {
    this.isStarted = false;
  }

  stop(): void {
    this.isRunning = false;
  }
}
