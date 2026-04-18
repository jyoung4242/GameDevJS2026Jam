import { Color, EventEmitter, GameEvent, Graph, PositionNode, Random, RentalPool, Vector } from "excalibur";
import { TowerManager } from "./TowerManager";
import { GameField } from "../Actors/GameField";
import { Enemy, FastEnemy, RangedEnemy, TankEnemy } from "../Actors/enemies";
import { LaserBeam, Missle, TowerBurst, TowerDrone, TowerWeapon } from "../Actors/SkillActors";
import { PositionNodeData } from "./mapGeneration";
import { EndOfWavePanel } from "../UI/EndOfWaveUI";

const POOL_SIZE = 100;
const STARTING_SPAWN_INTERVAL = 1000; // in milliseconds
const STARTING_NUM_ENEMIES = 7;

export type WaveState = "idle" | "active" | "cleanup" | "gameover";
export type EnemyTypes = "tank" | "fast" | "ranged";
export type WeaponTypes = "burst" | "missle" | "beam" | "drone";
export type SpawnPoints = "top" | "bottom" | "left" | "right";

export type WaveEvents = {
  waveStart: WaveStartEvent;
  waveEnd: WaveEndEvent;
  waveSpawn: WaveSpawnEvent;
};

export class EnemyWaveController {
  private rng: Random;
  private _towerManager: TowerManager; // to reference tower instances to the enemies
  private _gameField: GameField; // to reference the game field for spawning enemies

  private _navmap: Graph<PositionNodeData>;
  private _currentLevel: number = 1;
  private _numEnemeiesInWave: number = STARTING_NUM_ENEMIES;
  private _numberRemainaing: number = STARTING_NUM_ENEMIES;
  private _enemyPools: Map<EnemyTypes, RentalPool<Enemy>> = new Map();
  private _weaponPools: Map<WeaponTypes, RentalPool<TowerWeapon>> = new Map();
  private _waveState: WaveState = "idle";
  private _currentEnemies: Set<Enemy> = new Set();

  private _spawnTimer: number = 0;
  private _spawnInterval: number = STARTING_SPAWN_INTERVAL;

  public waveEmitter: EventEmitter<WaveEvents> = new EventEmitter();

  constructor(towerManager: TowerManager, gameField: GameField, navmap: Graph<PositionNodeData>, random: Random) {
    this._towerManager = towerManager;
    this._gameField = gameField;
    this._navmap = navmap;
    this.rng = random;
  }

  get tmanager() {
    return this._towerManager;
  }

  get gameField() {
    return this._gameField;
  }

  get level() {
    return this._currentLevel;
  }

  init() {
    //setup enemy pools
    this._enemyPools.set(
      "tank",
      new RentalPool<Enemy>(
        () => EnemyFactory("tank", Vector.Zero, this, this._gameField, this._towerManager, this._navmap),
        enemy => {
          enemy.targetTower = null;
          enemy.hp = 25;
          enemy.actions.clearActions();
          enemy.nodePath = [];
          enemy.graphics.current!.tint = Color.White;
          if (enemy.parent) {
            enemy.parent.removeChild(enemy);
          }
          return enemy;
        },
        POOL_SIZE,
      ),
    );
    this._enemyPools.set(
      "fast",
      new RentalPool<Enemy>(
        () => EnemyFactory("fast", Vector.Zero, this, this._gameField, this._towerManager, this._navmap),
        enemy => {
          enemy.targetTower = null;
          enemy.hp = 8;
          enemy.actions.clearActions();
          enemy.nodePath = [];
          enemy.graphics.current!.tint = Color.White;
          if (enemy.parent) {
            enemy.parent.removeChild(enemy);
          }
          return enemy;
        },
        POOL_SIZE,
      ),
    );
    this._enemyPools.set(
      "ranged",
      new RentalPool<Enemy>(
        () => EnemyFactory("ranged", Vector.Zero, this, this._gameField, this._towerManager, this._navmap),
        enemy => {
          enemy.targetTower = null;
          if (enemy.parent) {
            enemy.parent.removeChild(enemy);
          }
          return enemy;
        },
        POOL_SIZE,
      ),
    );

    //setup weapon pools
    this._weaponPools.set(
      "burst",
      new RentalPool<TowerWeapon>(
        () => WeaponFactory("burst", Vector.Zero, this, this._gameField, this._towerManager),
        weapon => {
          if (weapon.parent) {
            weapon.parent.removeChild(weapon);
          }
          return weapon;
        },
        POOL_SIZE,
      ),
    );
    this._weaponPools.set(
      "missle",
      new RentalPool<TowerWeapon>(
        () => WeaponFactory("missle", Vector.Zero, this, this._gameField, this._towerManager),
        weapon => {
          if (weapon.parent) {
            weapon.parent.removeChild(weapon);
          }
          return weapon;
        },
        POOL_SIZE,
      ),
    );
    this._weaponPools.set(
      "beam",
      new RentalPool<TowerWeapon>(
        () => WeaponFactory("beam", Vector.Zero, this, this._gameField, this._towerManager),
        weapon => {
          if (weapon.parent) {
            weapon.parent.removeChild(weapon);
          }
          return weapon;
        },
        POOL_SIZE,
      ),
    );
    this._weaponPools.set(
      "drone",
      new RentalPool<TowerWeapon>(
        () => WeaponFactory("drone", Vector.Zero, this, this._gameField, this._towerManager),
        weapon => {
          if (weapon.parent) {
            weapon.parent.removeChild(weapon);
          }
          return weapon;
        },
        POOL_SIZE,
      ),
    );
  }

  get enemies() {
    return this._currentEnemies;
  }

  startNewWave() {
    this._waveState = "active";
    this.waveEmitter.emit("waveStart");
    this._spawnTimer = 0;
    this._spawnInterval = STARTING_SPAWN_INTERVAL;

    console.log(`
    **************************************
    Starting wave ${this._currentLevel}
    **************************************`);
  }

  endCurrentWave() {
    console.log(`
    **************************************
    Wave ${this._currentLevel} complete
    **************************************`);
    this.waveEmitter.emit("waveEnd");
    this._waveState = "cleanup";
    this._currentLevel += 1;
    this._spawnInterval = this._spawnInterval * 0.9;
    this._numEnemeiesInWave = Math.floor(this._numEnemeiesInWave * 1.25);
    this._numberRemainaing = this._numEnemeiesInWave;
  }

  spawnEnemy() {
    let enemyType = this.chooseEnemeyType();
    let pool = this._enemyPools.get(enemyType)!;
    let enemy = pool.rent();
    this._currentEnemies.add(enemy);
    let spawnPoint = this.chooseSpawnPoint();
    this._gameField.spawnEnemy(enemy, spawnPoint);
    this.waveEmitter.emit("waveSpawn", { enemyType, spawnPoint: spawnPoint });
  }

  spawnWeapon(weaponType: WeaponTypes): TowerWeapon {
    let pool = this._weaponPools.get(weaponType)!;
    let weapon = pool.rent();
    return weapon;
  }

  returnWeaponToPool(weapon: TowerWeapon) {
    this.gameField.removeChild(weapon);
    let pool = this._weaponPools.get(weapon.type!)!;
    pool.return(weapon);
  }

  chooseSpawnPoint(): SpawnPoints {
    return this.rng.pickOne(["top", "bottom", "left", "right"]);
  }

  chooseEnemeyType(): EnemyTypes {
    return this.rng.pickOne(["tank", "ranged"]); //["fast", "tank", "ranged"]
  }

  returnEnemyToPool(enemy: Enemy) {
    let pool = this._enemyPools.get(enemy.enemyType!)!;
    //reset everything on enemy prior to returning
    enemy.hp = enemy.hpMax;
    enemy.actions.clearActions();
    enemy.graphics.current!.tint = Color.White;

    this._currentEnemies.delete(enemy);
    this._gameField.removeEnemy(enemy);
    pool.return(enemy);
  }

  update(dt: number) {
    if (this._waveState !== "active") return;
    this._spawnTimer += dt;
    //  check for no more enemies
    if (this._currentEnemies.size === 0 && this._numberRemainaing === 0) {
      this.endCurrentWave();
      // trigger UI wave end here
      this.gameField.addChild(new EndOfWavePanel());
    }

    if (this._waveState === "active" && this._spawnTimer >= this._spawnInterval) {
      //test to see if max number of enemmies have been spawned
      if (this._numberRemainaing === 0) return;
      this.spawnEnemy();
      this._spawnTimer = 0;
      this._numberRemainaing -= 1;
    }
  }
}

export class WaveStartEvent extends GameEvent<WaveEvents> {
  constructor() {
    super();
  }
}

export class WaveEndEvent extends GameEvent<WaveEvents> {
  constructor() {
    super();
  }
}

export class WaveSpawnEvent extends GameEvent<WaveEvents> {
  constructor() {
    super();
  }
}

function EnemyFactory(
  type: string,
  pos: Vector,
  waveManager: EnemyWaveController,
  gameField: GameField,
  towerManager: TowerManager,
  navmap: Graph<PositionNodeData>,
): Enemy {
  switch (type) {
    case "tank":
      return new TankEnemy(waveManager, gameField, towerManager, pos, navmap);
    case "fast":
      return new FastEnemy(waveManager, gameField, towerManager, pos, navmap);
    case "ranged":
      return new RangedEnemy(waveManager, gameField, towerManager, pos, navmap);
    default:
      throw new Error(`Unknown enemy type: ${type}`);
  }
}

function WeaponFactory(type: string, pos: Vector, waveManager: EnemyWaveController, gameField: GameField, towerManager: TowerManager) {
  switch (type) {
    case "burst":
      return new TowerBurst(waveManager, gameField, towerManager, pos);
    case "missle":
      return new Missle(waveManager, gameField, towerManager, pos);
    case "beam":
      return new LaserBeam(waveManager, gameField, towerManager, pos);
    case "drone":
      return new TowerDrone(waveManager, gameField, towerManager, pos);
    default:
      throw new Error(`Unknown enemy type: ${type}`);
  }
}
