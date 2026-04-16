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
import { enemyBurstColliderGroup, enemyColliderGroup } from "../CollisionGroups";
import { Tower } from "./towers";
import { EnemyTypes, EnemyWaveController } from "../Lib/enemyWaveController";
import { LootComponent, Rarity } from "../Components/LootComponent";
import { BurstShells, DroneEngine, LaserOptics, MissleChassis, PowerCell, PowerCore, Servos } from "./Loot";
import { PositionNodeData } from "../Lib/mapGeneration";
import { BehaviorTreeComponent, createBehaviorTree } from "../Components/BehaviorTree";
import { FindClosestTower, MeleeAttackAction, MoveCloserToTower, RangedAttackAction } from "../Actions/enemyActions";

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
  bt: BehaviorTreeComponent | null = null;
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
  }

  onInitialize(engine: Engine): void {
    // this.on("actioncomplete", this.actionHandler);
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
    // this.findTargetTower();
    // let targtNode = this.getGraphNode(this.targetTower!.pos);
    // let currentNode = this.getGraphNode(this.pos);
    // if (!currentNode || !targtNode) return;
    // let astar = this.navmap.aStar(currentNode, targtNode);
    // this.nodePath = astar.path!;
    // if (this.nodePath && this.nodePath.length > 0) {
    //   this.actions.moveTo(this.nodePath[0].pos, this.speed);
    //   this.nodePath.shift();
    // }
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

  // onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
  //   if (other.owner instanceof Tower) {
  //     let tower = other.owner as Tower;
  //     (self.owner as Enemy).actions.clearActions();
  //     tower.takeDamage(10);
  //     // return to rental pool
  //     this.waveManager.returnEnemyToPool(this);
  //   }
  // }

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

  targetRangeCheck() {
    if (!this.targetTower) return false;
    //return false if out of range, return true if it is less than range
    return this.targetTower.pos.distance(this.pos) < this.range;
  }

  targetCheck() {
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
    this.strength = 8;
    this.hp = 25;
    this.range = 80;
  }

  onInitialize(engine: Engine): void {
    this.bt = createBehaviorTree(this, "Selector")
      .sequence("Has Target Tower")
      .condition("Target Exists and Alive", () => this.targetCheck())
      .selector("Has Target within Melee Range")
      .sequence("In Attack Range")
      .condition("In Range?", () => this.targetRangeCheck())
      .action("MeleeAttackTower", new MeleeAttackAction(this, 2000))
      .end()
      .action("Move closer to tower", new MoveCloserToTower(this, this.speed))
      .end()
      .end()
      .action("Find Nearest Tower Action", new FindClosestTower(this.scene!, this))
      .build();
    this.addComponent(this.bt);
    this.bt.logTree();
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
    this.range = 300;
  }
  onInitialize(engine: Engine): void {
    this.bt = createBehaviorTree(this, "Selector")
      .sequence("Has Target Tower")
      .condition("Target Exists and Alive", () => this.targetCheck())
      .selector("Has Target within Melee Range")
      .sequence("In Attack Range")
      .condition("In Range?", () => this.targetRangeCheck())
      .action("RangeAttackTower", new RangedAttackAction(this, 1250))
      .end()
      .action("Move closer to tower", new MoveCloserToTower(this, this.speed))
      .end()
      .end()
      .action("Find Nearest Tower Action", new FindClosestTower(this.scene!, this))
      .build();
    this.addComponent(this.bt);
    this.bt.logTree();
  }

  fireWeapon(target: Tower) {
    let burst = this.waveManager.gameField.addChild(new EnemyBurst(this, target));
    //reset burst position to tower position
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
    this.actions.meet(this.target, this.speed);
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Tower) {
      let tower = other.owner as Tower;
      tower.takeDamage(this.strength);
      this.kill();
    }
  }
}
