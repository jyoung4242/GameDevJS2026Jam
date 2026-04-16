import { ActorEvents, Component, Engine, Entity, toRadians, vec } from "excalibur";
import { OtherTower, Tower } from "../Actors/towers";
import { EnemyWaveController } from "./enemyWaveController";
import { Enemy } from "../Actors/enemies";
import { LaserBeam, Missle, TowerBurst, TowerDrone } from "../Actors/SkillActors";

export type ProgressionMapEntry = {
  skillStrength: number;
  actionCooldown: number;
  actionDuration: number;
  detectionRange: number;
  angle?: number;
};

export abstract class TowerSkill extends Component {
  progressionLookup: Record<number, ProgressionMapEntry> = {
    1: { skillStrength: 1, actionCooldown: 1500, actionDuration: -1, detectionRange: 100 },
  };
  actionCooldown: number = 1;
  actionDuration: number = 1;
  skillStrength: number = 1;
  level: number = 1;
  status: "active" | "cooldown" | "inactive" = "inactive";
  currentTimer: number = 0;
  detectionRange: number = 0;
  ewc: EnemyWaveController;
  isActionTriggered: boolean = false;

  constructor(enemyWaveController: EnemyWaveController) {
    super();
    this.updateSkillsByLevel();
    this.ewc = enemyWaveController;
  }

  get skills(): ProgressionMapEntry | undefined {
    if (this.progressionLookup) {
      return this.progressionLookup[this.level];
    }
  }

  onAdd = (owner: Entity): void => {
    this.level = 1;
    this.updateSkillsByLevel();
    this.owner = owner;
    this.status = "inactive";

    //setup code
    this.owner.on("preupdate", this.update);
  };

  onRemove(previousOwner: Entity): void {
    //teardown code
    this.owner!.off("preupdate", this.update);
  }

  update = (event: ActorEvents["preupdate"]): void => {
    let { elapsed, engine } = event;

    if (!this.preUpdateCheck()) return;

    // inactive state
    if (this.status === "inactive") {
      if (this.preUpdateCheck()) {
        this.setState("active");
        this.currentTimer = 0;
      }
    }

    this.currentTimer += elapsed;
    // cooldown and active states
    if (this.status === "active") {
      if (this.actionDuration < 0) {
        //instant action, execute once
        this.executeAction();
        this.setState("cooldown");
        this.currentTimer = 0;
      } else {
        //execute action while timer is less than duration
        if (!this.isActionTriggered) {
          this.executeAction();
          this.isActionTriggered = true;
        }

        if (this.currentTimer >= this.actionDuration + this.actionCooldown) {
          this.setState("cooldown");
          this.currentTimer = 0;
          this.isActionTriggered = false;
        }
      }
    } else if (this.status === "cooldown") {
      this.currentTimer += elapsed;
      if (this.currentTimer >= this.actionCooldown) {
        this.setState("active");
        this.currentTimer = 0;
      }
    }
  };

  setState(state: "active" | "cooldown" | "inactive") {
    this.status = state;
  }

  updateSkillsByLevel() {
    const entry = this.progressionLookup[this.level];
    this.actionCooldown = entry.actionCooldown;
    this.actionDuration = entry.actionDuration;
    this.skillStrength = entry.skillStrength;
    this.detectionRange = entry.detectionRange;
  }

  upgrade(): void {
    this.level++;
    this.updateSkillsByLevel();
  }

  abstract executeAction(): void;

  // check to determin if action can be executed i.e. enemy detection and whatnot
  abstract preUpdateCheck(): boolean;
}

export class BurstTowerSkill extends TowerSkill {
  target: Enemy | undefined;
  // weak strength, short cooldown, instant duration
  level: number = 1;
  progressionLookup: Record<number, ProgressionMapEntry> = {
    1: { skillStrength: 1, actionCooldown: 1500, actionDuration: -1, detectionRange: 400 },
    2: { skillStrength: 2, actionCooldown: 1200, actionDuration: -1, detectionRange: 425 },
    3: { skillStrength: 3, actionCooldown: 900, actionDuration: -1, detectionRange: 500 },
  };

  constructor(ewc: EnemyWaveController) {
    super(ewc);
  }

  executeAction(): void {
    //rent burst from ewc
    let burst = this.ewc.spawnWeapon("burst") as TowerBurst;
    //reset burst position to tower position
    burst.pos = (this.owner! as Tower).pos;
    burst.direction = this.target!.pos.sub(burst.pos).normalize();
    burst.strength = this.skillStrength;
    if (burst.parent) {
      burst.parent.removeChild(burst);
    }
    this.ewc.gameField.addChild(burst);
  }

  preUpdateCheck(): boolean {
    let closestEnemy = FindFirstEnemeyWithinRange(this.ewc, this.owner as Tower, this);
    if (closestEnemy) {
      this.target = closestEnemy as Enemy;
      return true;
    }
    this.target = undefined;
    return false;
  }
}

export class HomingMissileTowerSkill extends TowerSkill {
  target: Enemy | undefined;
  // high strength, long cooldown, instant duration
  level: number = 1;
  progressionLookup: Record<number, ProgressionMapEntry> = {
    1: { skillStrength: 10, actionCooldown: 1500, actionDuration: -1, detectionRange: 300 },
    2: { skillStrength: 20, actionCooldown: 2000, actionDuration: -1, detectionRange: 400 },
    3: { skillStrength: 30, actionCooldown: 3000, actionDuration: -1, detectionRange: 500 },
  };
  constructor(ewc: EnemyWaveController) {
    super(ewc);
  }

  executeAction(): void {
    //rent burst from ewc
    let missle = this.ewc.spawnWeapon("missle") as Missle;
    //reset missle position to tower position
    missle.pos = (this.owner! as Tower).pos;
    missle.setTarget(this.target!);
    missle.strength = this.skillStrength;
    this.ewc.gameField.addChild(missle);
  }
  preUpdateCheck(): boolean {
    let closestEnemy = FindFirstEnemeyWithinRange(this.ewc, this.owner as Tower, this);

    if (closestEnemy) {
      this.target = closestEnemy as Enemy;
      return true;
    }
    this.target = undefined;
    return false;
  }
}

export class LaserBeamTowerSkill extends TowerSkill {
  // mid strength, mid cooldown, long duration
  level: number = 1;
  angle: number | undefined;
  target: Enemy | undefined;
  progressionLookup: Record<number, ProgressionMapEntry> = {
    1: { skillStrength: 8, actionCooldown: 2000, actionDuration: 1000, detectionRange: 400, angle: toRadians(45) },
    2: { skillStrength: 15, actionCooldown: 1750, actionDuration: 750, detectionRange: 400, angle: toRadians(60) },
    3: { skillStrength: 20, actionCooldown: 1500, actionDuration: 500, detectionRange: 400, angle: toRadians(90) },
  };
  constructor(ewc: EnemyWaveController) {
    super(ewc);
  }

  updateSkillsByLevel(): void {
    super.updateSkillsByLevel();
    this.angle = this.progressionLookup[this.level].angle;
  }

  executeAction(): void {
    //rent burst from ewc
    let beam = this.ewc.spawnWeapon("beam") as LaserBeam;
    //reset missle position to tower position
    beam.pos = (this.owner! as OtherTower).pos;

    beam.setDirection(this.target!.pos.sub(beam.pos).normalize());
    beam.setSweepAngle(this.angle!);
    beam.setDuration(this.progressionLookup[this.level].actionDuration);

    beam.strength = this.skillStrength;
    this.ewc.gameField.addChild(beam);
  }
  preUpdateCheck(): boolean {
    let closestEnemy = FindFirstEnemeyWithinRange(this.ewc, this.owner as Tower, this);

    if (closestEnemy) {
      this.target = closestEnemy as Enemy;
      return true;
    }
    return false;
  }
}

export class LaunchDroneSkill extends TowerSkill {
  // mid strength, mid cooldown, long duration
  level: number = 1;
  angle: number | undefined;
  target: Enemy | undefined;
  progressionLookup: Record<number, ProgressionMapEntry> = {
    1: { skillStrength: 1, actionCooldown: 4000, actionDuration: -1, detectionRange: 400 },
    2: { skillStrength: 2, actionCooldown: 3500, actionDuration: -1, detectionRange: 400 },
    3: { skillStrength: 3, actionCooldown: 3000, actionDuration: -1, detectionRange: 400 },
  };
  constructor(ewc: EnemyWaveController) {
    super(ewc);
  }

  updateSkillsByLevel(): void {
    super.updateSkillsByLevel();
    this.angle = this.progressionLookup[this.level].angle;
  }

  executeAction(): void {
    let drone = this.ewc.spawnWeapon("drone") as TowerDrone;
    drone.pos = (this.owner! as OtherTower).pos;
    drone.strength = this.skillStrength;
    drone.isEnabled = true;

    drone.target = this.target!;
    this.ewc.gameField.addChild(drone);
  }
  preUpdateCheck(): boolean {
    let closestEnemy = FindFirstEnemeyWithinRange(this.ewc, this.owner as Tower, this);

    if (closestEnemy) {
      this.target = closestEnemy as Enemy;
      return true;
    }
    return false;
  }
}

function FindFirstEnemeyWithinRange(ewc: EnemyWaveController, tower: Tower, skill: TowerSkill): Enemy | null {
  const distance = skill.skills!.detectionRange;
  // create a map of enemies within range with their distances from the tower
  let enemies = ewc.enemies;
  const enemiesWithinRange = new Map<Enemy, number>();
  for (const enemy of enemies) {
    const distanceToEnemy = enemy.pos.distance(tower.pos);
    if (distanceToEnemy <= distance) {
      enemiesWithinRange.set(enemy, distanceToEnemy);
    }
  }

  // find the closest enemy and return it
  let closestEnemy = null;
  let closestDistance = Infinity;
  for (const [enemy, distance] of enemiesWithinRange) {
    if (distance < closestDistance) {
      closestEnemy = enemy;
      closestDistance = distance;
    }
  }
  return closestEnemy;
}
