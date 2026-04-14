import { Actor, Collider, CollisionContact, CollisionGroup, CollisionType, Color, Engine, Side, Vector } from "excalibur";
import { GameField } from "./GameField";
import { TowerManager } from "../Lib/TowerManager";
import { enemyColliderGroup } from "../CollisionGroups";
import { Tower } from "./towers";
import { EnemyTypes, EnemyWaveController } from "../Lib/enemyWaveController";
import { LootComponent, Rarity } from "../Components/LootComponent";
import { BurstShells, DroneEngine, LaserOptics, MissleChassis, PowerCell, PowerCore, Servos } from "./Loot";

export abstract class Enemy extends Actor {
  enemyType: EnemyTypes | null = null;
  waveManager: EnemyWaveController;
  gameField: GameField;
  towerManager: TowerManager;

  hp: number = 1;
  strength: number = 1;
  speed: number = 1;

  constructor(
    waveManager: EnemyWaveController,
    gamefield: GameField,
    TowerManager: TowerManager,
    pos: Vector,
    shape: "circle" | "box" = "box",
  ) {
    let args =
      shape === "circle"
        ? { pos, radius: 32, color: Color.Transparent, CollisionGroup: enemyColliderGroup, CollisionType: CollisionType.Passive }
        : {
            pos,
            width: 64,
            height: 64,
            color: Color.Transparent,
            CollisionGroup: enemyColliderGroup,
            CollisionType: CollisionType.Passive,
          };
    super(args);
    this.waveManager = waveManager;
    this.gameField = gamefield;
    this.towerManager = TowerManager;
  }

  onAdd(engine: Engine): void {
    this.actions.meet(this.towerManager.getclosestTower(), this.speed);

    this.addComponent(
      new LootComponent({
        scatterRadius: 32,
        entries: [
          { factory: () => new MissleChassis(), weight: 5, rarity: Rarity.Uncommon },
          { factory: () => new BurstShells(), weight: 5, rarity: Rarity.Uncommon },
          { factory: () => new DroneEngine(), weight: 5, rarity: Rarity.Uncommon },
          { factory: () => new LaserOptics(), weight: 5, rarity: Rarity.Uncommon },
          { factory: () => new PowerCore(), weight: 20, rarity: Rarity.Common },
          { factory: () => new PowerCell(), weight: 20, rarity: Rarity.Common },
          { factory: () => new Servos(), weight: 20, rarity: Rarity.Common },
        ],
      }),
    );
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Tower) {
      let tower = other.owner as Tower;
      (self.owner as Enemy).actions.clearActions();
      tower.takeDamage(10);
      // return to rental pool
      this.waveManager.returnEnemyToPool(this);
    }
  }

  takeDamage(damageAmount: number) {
    console.log("damage: ", damageAmount);

    this.hp -= damageAmount;
    if (this.hp <= 0) {
      this.get(LootComponent).dropOne(this.gameField, this.pos);
      this.waveManager.returnEnemyToPool(this);
    }
  }
}

export class TankEnemy extends Enemy {
  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, "box");
    this.enemyType = "tank";
    this.graphics.color = Color.Red;
    this.speed = 80; //10
    this.strength = 8;
    this.hp = 25;
  }
}
export class RangedEnemy extends Enemy {
  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, "circle");
    this.graphics.color = Color.Blue;
    this.enemyType = "ranged";
    this.speed = 80; //30
    this.strength = 5;
    this.hp = 8;
  }
}
export class FastEnemy extends Enemy {
  constructor(waveManager: EnemyWaveController, gamefield: GameField, TowerManager: TowerManager, pos: Vector) {
    super(waveManager, gamefield, TowerManager, pos, "circle");
    this.graphics.color = Color.Green;
    this.enemyType = "fast";
    this.speed = 80; //75
    this.strength = 8;
    this.hp = 15;
  }
}
