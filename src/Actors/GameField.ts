import { Actor, CollisionType, Color, Engine, PointerEvent, Random, TileMap, Vector } from "excalibur";
import { Tower } from "./towers";
import { EnemyWaveController, SpawnPoints } from "../Lib/enemyWaveController";
import { Enemy, EnemyBurst, RangedEnemy, TankEnemy } from "./enemies";
import { TowerManager } from "../Lib/TowerManager";
import { TowerBurst, TowerWeapon } from "./SkillActors";

const SPAWN_BUFFER = 100;
export const TILE_SIZE = 32;

export class GameField extends Actor {
  readonly MAX_SPAWN_ATTEMPTS = 10;
  tilemap: TileMap;
  rng: Random = new Random();
  wm: EnemyWaveController | null = null;
  towerManager: TowerManager | null = null;
  constructor(pos: Vector, dims: Vector, tilemap: TileMap) {
    super({
      pos,
      width: dims.x,
      height: dims.y,
      color: Color.Transparent, //Color.fromHex("#5d682f"),
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    this.tilemap = tilemap;
  }

  onInitialize(engine: Engine): void {
    engine.currentScene.camera.strategy.lockToActor(this);
    engine.currentScene.camera.zoom = 0.4;

    // this.on("pointerdown", this.touchHandler);
  }

  registerWaveManager(wm: EnemyWaveController) {
    this.wm = wm;
  }

  registerTowerManager(tm: TowerManager) {
    this.towerManager = tm;
  }

  touchHandler = (evt: PointerEvent) => {
    // this.towerManager!.createTower("other", evt.worldPos);
    // get mouse click position, check which Tile it's on, and confirm if solid
    const tileX = Math.floor(evt.worldPos.x / TILE_SIZE);
    const tileY = Math.floor(evt.worldPos.y / TILE_SIZE);
    const tile = this.tilemap.getTile(tileX, tileY);
    console.log(tile);

    if (tile && tile.solid) return;
    this.towerManager!.createTower("other", evt.worldPos);
  };

  spawnTower(tower: Tower) {
    this.addChild(tower);
  }

  spawnEnemy(type: Enemy, side: SpawnPoints) {
    let spawnPoint = this.getEdgeVector(side);

    if (type.parent) {
      type.parent.removeChild(type);
    }
    type.pos = spawnPoint!;
    type.actions.clearActions();
    type.hp = type.hpMax;
    // type.bt?.reset();
    type.targetTower = null;
    this.addChild(type);
  }

  reset() {
    console.log(this.children);

    //reverse for loop
    for (let i = this.children.length - 1; i >= 0; i--) {
      const c = this.children[i];
      if (c instanceof Tower) {
        console.log("removing tower", c);
        this.removeChild(c);
        c.kill();
      } else if (c instanceof Enemy) {
        console.log("removing enemy", c);
        this.wm!.returnEnemyToPool(c);
      } else if (c instanceof TowerWeapon) {
        console.log("removing weapon", c);
        this.wm!.returnWeaponToPool(c);
      }
    }

    // this.children.forEach(c => {
    //   console.log(c);
    //   if (c instanceof Tower) {
    //     console.log("removing tower", c);

    //     this.removeChild(c);
    //     c.kill();
    //   } else if (c instanceof Enemy) {
    //     console.log("removing enemy", c);
    //     this.wm!.returnEnemyToPool(c);
    //   } else if (c instanceof TowerWeapon) {
    //     console.log("removing weapon", c);
    //     this.wm!.returnWeaponToPool(c);
    //   }
    // });
    console.log(this.children);
  }

  setNewTilemap(tilemap: TileMap) {
    //remove tilemap from GF
    this.removeChild(this.tilemap);
    //set new tilemap
    this.tilemap = tilemap;
    //add tilemap to GF
    this.addChild(this.tilemap);
  }

  removeEnemy(enemy: Enemy) {
    this.removeChild(enemy);
  }

  // getEdgeVector(side: SpawnPoints, buffer: number): Vector {
  //   let spawnXmin, spawnXmax, spawnYmin, spawnYmax;

  //   switch (side) {
  //     case "top":
  //       spawnXmin = 0;
  //       spawnXmax = this.width;
  //       spawnYmin = 0;
  //       spawnYmax = buffer;
  //       break;
  //     case "bottom":
  //       spawnXmin = 0;
  //       spawnXmax = this.width;
  //       spawnYmin = this.height - buffer;
  //       spawnYmax = this.height;
  //       break;
  //     case "left":
  //       spawnXmin = 0;
  //       spawnXmax = buffer;
  //       spawnYmin = 0;
  //       spawnYmax = this.height;
  //       break;
  //     case "right":
  //       spawnXmin = this.width - buffer;
  //       spawnXmax = this.width;
  //       spawnYmin = 0;
  //       spawnYmax = this.height;
  //       break;
  //   }

  //   return new Vector(this.rng.integer(spawnXmin, spawnXmax), this.rng.integer(spawnYmin, spawnYmax));
  // }
  getEdgeVector(side: SpawnPoints): Vector | null {
    const cols = Math.floor(this.width / TILE_SIZE);
    const rows = Math.floor(this.height / TILE_SIZE);

    let tileXmin: number, tileXmax: number, tileYmin: number, tileYmax: number;

    switch (side) {
      case "top":
        tileXmin = 2;
        tileXmax = cols - 2;
        tileYmin = 2;
        tileYmax = 2;
        break;
      case "bottom":
        tileXmin = 2;
        tileXmax = cols - 2;
        tileYmin = rows - 2;
        tileYmax = rows - 2;
        break;
      case "left":
        tileXmin = 2;
        tileXmax = 2;
        tileYmin = 2;
        tileYmax = rows - 2;
        break;
      case "right":
        tileXmin = cols - 2;
        tileXmax = cols - 2;
        tileYmin = 2;
        tileYmax = rows - 2;
        break;
    }

    for (let attempt = 0; attempt < this.MAX_SPAWN_ATTEMPTS; attempt++) {
      const tx = this.rng.integer(tileXmin, tileXmax);
      const ty = this.rng.integer(tileYmin, tileYmax);
      const tile = this.tilemap.getTile(tx, ty);

      if (tile && !tile.solid) {
        return new Vector(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
      }
    }

    console.warn(`getEdgeVector: no non-solid tile found on "${side}" edge after ${this.MAX_SPAWN_ATTEMPTS} attempts`);
    return null;
  }
}
