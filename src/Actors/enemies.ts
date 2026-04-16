import {
  ActionCompleteEvent,
  Actor,
  Collider,
  CollisionContact,
  CollisionType,
  Color,
  Engine,
  Graph,
  MoveTo,
  PositionNode,
  Side,
  Vector,
} from "excalibur";
import { GameField } from "./GameField";
import { TowerManager } from "../Lib/TowerManager";
import { enemyColliderGroup } from "../CollisionGroups";
import { Tower } from "./towers";
import { EnemyTypes, EnemyWaveController } from "../Lib/enemyWaveController";
import { LootComponent, Rarity } from "../Components/LootComponent";
import { BurstShells, DroneEngine, LaserOptics, MissleChassis, PowerCell, PowerCore, Servos } from "./Loot";
import { PositionNodeData } from "../Lib/mapGeneration";

export abstract class Enemy extends Actor {
  enemyType: EnemyTypes | null = null;
  waveManager: EnemyWaveController;
  gameField: GameField;
  towerManager: TowerManager;
  navmap: Graph<PositionNodeData>;
  targetTower: Tower | null = null;
  nodePath: PositionNode<PositionNodeData>[] = [];
  hp: number = 1;
  strength: number = 1;
  speed: number = 1;

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
  }

  onInitialize(engine: Engine): void {
    this.on("actioncomplete", this.actionHandler);
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

  onAdd(engine: Engine): void {
    // set target initially
    debugger;
    this.findTargetTower();
    let targtNode = this.getGraphNode(this.targetTower!.pos);
    let currentNode = this.getGraphNode(this.pos);
    if (!currentNode || !targtNode) return;
    let astar = this.navmap.aStar(currentNode, targtNode);
    this.nodePath = astar.path!;
    if (this.nodePath && this.nodePath.length > 0) {
      this.actions.moveTo(this.nodePath[0].pos, this.speed);
      this.nodePath.shift();
    }
  }

  actionHandler = (e: ActionCompleteEvent) => {
    if (e.action instanceof MoveTo) {
      // log action completed
      console.log("action completed", e.action);
    }

    if (!this.targetTower) {
      this.findTargetTower();
      let targtNode = this.getGraphNode(this.targetTower!.pos);
      let currentNode = this.getGraphNode(this.pos);
      if (!currentNode || !targtNode) return;
      let astar = this.navmap.aStar(currentNode, targtNode);
      this.nodePath = astar.path!;
    }

    if (this.nodePath && this.nodePath.length > 0) {
      this.actions.moveTo(this.nodePath[0].pos, this.speed);
      this.nodePath.shift();
    }
  };

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
    this.hp -= damageAmount;
    if (this.hp <= 0) {
      this.get(LootComponent).dropOne(this.gameField, this.pos);
      this.waveManager.returnEnemyToPool(this);
    }
  }

  findTargetTower() {
    let towers: Tower[] | undefined = this.scene?.entities.filter(e => e instanceof Tower);
    if (!towers) return;
    // find closest tower
    let closestTower = null;
    let closestDistance = Infinity;
    for (const tower of towers) {
      let distance = tower.pos.distance(this.pos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTower = tower;
      }
    }
    this.targetTower = closestTower;
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

  onPreUpdate(engine: Engine, elapsed: number): void {
    // check if target tower is still viable
    // if (!this.targetTower) {
    //   this.findTargetTower();
    //   let targtNode = this.getGraphNode(this.targetTower!.pos);
    //   let currentNode = this.getGraphNode(this.pos);
    //   if (!currentNode || !targtNode) return;
    //   let astar = this.navmap.aStar(currentNode, targtNode);
    //   this.nodePath = astar.path!;
    //   if (this.nodePath.length == 0) console.log(this.nodePath);
    // }
    // if (this.actions.getQueue().getActions().length !== 0) {
    //   // action currently active
    //   // console.log(this.actions.getQueue().getActions());
    // } else {
    //   // action not active
    //   if (this.nodePath && this.nodePath.length > 0) {
    //     console.log("setting moveTo", this.nodePath[0]);
    //     this.actions.moveTo(this.nodePath[0].pos, this.speed);
    //     this.nodePath.shift();
    //     console.log("new nodepath", this.nodePath[0]);
    //   }
    // }
  }
}

// else if (this.nodePath && this.nodePath.length === 2) {
//       this.actions.meet(this.targetTower!, this.speed);
//     } else if (this.nodePath.length === 1) {
//       this.actions.clearActions();
//       this.targetTower = null;
//     }

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
    this.strength = 8;
    this.hp = 25;
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
  }
}
export class FastEnemy extends Enemy {
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
    this.speed = 80; //75
    this.strength = 8;
    this.hp = 15;
  }
}
