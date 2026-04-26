import { Engine, Random, Scene, SceneActivationContext, TileMap, vec, Vector } from "excalibur";
import { GameField } from "../Actors/GameField";
import { EnemyWaveController } from "../Lib/enemyWaveController";
import { TowerManager } from "../Lib/TowerManager";
import { buildTileGraph, buildTileMap, generateMapData } from "../Lib/mapGeneration";
import { InventoryObject } from "../Lib/InventoryObject";
import { LootCollector } from "../Actors/Loot";
import "../main.screen";
import { MainScreen } from "../main.screen";
import { GameOverPanel } from "../UI/gameoverBannerUI";
import { Resources } from "../resources";
import { MuteManager, UIMute } from "../UI/muteUI";
import { MuteableEngine } from "../main";

export class MainScene extends Scene {
  rng: Random = new Random();
  tw: TowerManager | null = null;
  ewc: EnemyWaveController | null = null;
  gf: GameField | null = null;
  loot: LootCollector | null = null;
  mainScreenEl: MainScreen | null = null;
  tmap: TileMap | null = null;
  firstTimeFlag: boolean = true;

  constructor() {
    super();
  }

  onInitialize(engine: Engine): void {
    // Map Generation
    const mapData = generateMapData({ cols: 56, rows: 31, seed: Date.now() });
    this.tmap = buildTileMap(mapData, { tileSize: 32 });
    const navMap = buildTileGraph(this.tmap);

    // setup actors and managers
    this.gf = new GameField(Vector.Zero, vec(1792, 992), this.tmap);
    this.tw = new TowerManager(this.gf);
    this.ewc = new EnemyWaveController(engine as MuteableEngine, this.tw, this.gf, navMap.graph, this.rng);
    this.ewc.init();
    this.loot = new LootCollector();

    this.gf.registerTowerManager(this.tw);
    this.gf.registerWaveManager(this.ewc);

    this.tw.registerEWC(this.ewc);
    InventoryObject.init(this.loot.eventEmitter);

    // setup UI
    this.mainScreenEl = document.getElementsByTagName("main-screen")[0]! as MainScreen;
    if (!this.mainScreenEl) {
      throw new Error("Main Screen not found");
    }

    let topLeft = engine.screen.screenToPageCoordinates(vec(0, 0));
    this.mainScreenEl.setPos(topLeft.x, topLeft.y);
    this.mainScreenEl.setRandom(this.rng);
    this.mainScreenEl.generateOffer();
    const dimensions = engine.getWorldBounds();
    this.mainScreenEl.setDimensions(dimensions.width, dimensions.height);
    this.mainScreenEl.setPixelRatio(engine.pixelRatio);
    this.mainScreenEl.setWaveManager(this.ewc);
    this.mainScreenEl.setTowerManager(this.tw);

    // setup events to refresh UI
    this.tw.towerEmitter.on("towerCreated", () => this.mainScreenEl!.requestUpdate());
    this.tw.towerEmitter.on("towerDestroyed", () => this.mainScreenEl!.requestUpdate());
    this.tw.towerEmitter.on("allTowersDestroyed", () => this.gameOverTransition());
    this.tw.towerEmitter.on("towerSelected", () => this.mainScreenEl?.showTowerDetails());
    this.loot.eventEmitter.on("LootCollected", () => this.mainScreenEl!.requestUpdate());
    this.loot.eventEmitter.on("Money", () => this.mainScreenEl!.requestUpdate());
    engine.screen.events.on("resize", () => {
      const topLeft = engine.screen.screenToPageCoordinates(vec(0, 0));
      this.mainScreenEl!.setPos(topLeft.x, topLeft.y);
    });
    this.add(this.gf);
    if (!(engine as MuteableEngine).mute) Resources.sprocketSound.play();
  }

  gameOverTransition() {
    this.mainScreenEl!.visible = false;
    this.gf!.addChild(new GameOverPanel());
    setTimeout(() => this.engine.goToScene("gameover"), 4000);
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {
    //reset game code
    this.mainScreenEl!.visible = true;
    // ensure no stray towers exist moving into scene
    this.tw?.resetTowers();
    //ensure gf has no tower children
    this.gf!.reset();
    console.log("resetting level and adding children");

    this.tw!.createTower("power", new Vector(900, 500));
    if (!this.gf?.hasChild(this.tmap!)) this.gf!.addChild(this.tmap!);
    if (!this.gf?.hasChild(this.loot!)) this.gf!.addChild(this.loot!);
    this.ewc!.reset();
    InventoryObject.resetScrap();
    InventoryObject.money = 20;
    if (!this.firstTimeFlag) {
      const mapData = generateMapData({ cols: 56, rows: 31, seed: Date.now() });
      this.tmap = buildTileMap(mapData, { tileSize: 32 });
      const navMap = buildTileGraph(this.tmap);
      this.gf?.setNewTilemap(this.tmap!);
      this.ewc?.setNewNavMap(navMap.graph);
    } else {
      this.firstTimeFlag = false;
    }
  }

  onDeactivate(context: SceneActivationContext) {
    // remove all towers and enemies
    this.tw?.resetTowers();
    //ensure gf has no tower children
    this.gf!.reset();
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.ewc!.update(elapsed);
  }
}
