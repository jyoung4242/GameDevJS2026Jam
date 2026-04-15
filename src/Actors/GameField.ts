import { Actor, CollisionType, Color, Engine, PointerEvent, Random, ScreenElement, Vector } from "excalibur";
import { OtherTower, PowerPlantTower, Tower } from "./towers";
import { EnemyTypes, EnemyWaveController, SpawnPoints } from "../Lib/enemyWaveController";
import { Enemy } from "./enemies";
import { TowerManager } from "../Lib/TowerManager";

const SPAWN_BUFFER = 100;

export class GameField extends Actor {
  rng: Random = new Random();
  wm: EnemyWaveController | null = null;
  towerManager: TowerManager | null = null;
  constructor(pos: Vector, dims: Vector) {
    super({
      pos,
      width: dims.x,
      height: dims.y,
      color: Color.fromHex("#5d682f"),
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
  }

  onInitialize(engine: Engine): void {
    engine.currentScene.camera.strategy.lockToActor(this);
    engine.currentScene.camera.zoom = 0.4;

    this.on("pointerdown", this.touchHandler);
  }

  registerWaveManager(wm: EnemyWaveController) {
    this.wm = wm;
  }

  registerTowerManager(tm: TowerManager) {
    this.towerManager = tm;
  }

  touchHandler = (evt: PointerEvent) => {
    this.towerManager!.createTower("other", evt.worldPos);
  };

  spawnTower(tower: Tower) {
    this.addChild(tower);
  }

  spawnEnemy(type: Enemy, side: SpawnPoints) {
    let spawnPoint = this.getEdgeVector(side, SPAWN_BUFFER);

    // set enemy position before adding
    type.pos = spawnPoint;
    if (type.parent) {
      type.parent.removeChild(type);
    }
    this.addChild(type);
  }

  removeEnemy(enemy: Enemy) {
    this.removeChild(enemy);
  }

  getEdgeVector(side: SpawnPoints, buffer: number): Vector {
    let spawnXmin, spawnXmax, spawnYmin, spawnYmax;

    switch (side) {
      case "top":
        spawnXmin = 0;
        spawnXmax = this.width;
        spawnYmin = 0;
        spawnYmax = buffer;
        break;
      case "bottom":
        spawnXmin = 0;
        spawnXmax = this.width;
        spawnYmin = this.height - buffer;
        spawnYmax = this.height;
        break;
      case "left":
        spawnXmin = 0;
        spawnXmax = buffer;
        spawnYmin = 0;
        spawnYmax = this.height;
        break;
      case "right":
        spawnXmin = this.width - buffer;
        spawnXmax = this.width;
        spawnYmin = 0;
        spawnYmax = this.height;
        break;
    }

    return new Vector(this.rng.integer(spawnXmin, spawnXmax), this.rng.integer(spawnYmin, spawnYmax));
  }
}
