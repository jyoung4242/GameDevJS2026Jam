// main.ts
import { GameField } from "./Actors/GameField";
import { EnemyWaveController } from "./Lib/enemyWaveController";
import { TowerManager } from "./Lib/TowerManager";
import "./style.css";

import { Engine, DisplayMode, Vector, vec, Keys, KeyEvent } from "excalibur";
import { buildTileGraph, buildTileMap, generateMapData } from "./Lib/mapGeneration";
import "./main.screen";
import { MainScreen } from "./main.screen";
import { LootCollector } from "./Actors/Loot";
import { loader } from "./resources";
import { InventoryObject } from "./Lib/InventoryObject";

// TODO move to scene
const mainScreenEl = document.getElementsByTagName("main-screen")[0]! as MainScreen;
mainScreenEl.visible = true;

const game = new Engine({
  canvasElementId: "game",
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelRatio: 2,
  pixelArt: true,
});

// Map Generation
const mapData = generateMapData({ cols: 56, rows: 31, seed: Date.now() });
const tileMap = buildTileMap(mapData, { tileSize: 32 });
const navMap = buildTileGraph(tileMap);

await game.start(loader);
const gameInventory = InventoryObject;
let gField = new GameField(Vector.Zero, vec(1792, 992), tileMap);
game.add(gField);
gField.addChild(tileMap);
let towerManager = new TowerManager(gField);
let waveManager = new EnemyWaveController(towerManager, gField, navMap.graph);
waveManager.init();
towerManager.createTower("power", new Vector(900, 500));
gField.registerWaveManager(waveManager);
gField.registerTowerManager(towerManager);
towerManager.registerEWC(waveManager);

//Wiring up loot collection to inventory
let lootCollector = new LootCollector();
gField.addChild(lootCollector);
gameInventory.init(lootCollector.eventEmitter);

game.input.keyboard.on("press", (e: KeyEvent) => {
  if (e.key === Keys.Space) {
    waveManager.startNewWave();
  }
});

game.onPreUpdate = (engine: Engine, dt: number) => waveManager.update(dt);
// TODO move to scene
// const topLeft = game.screen.contentArea.topLeft;
const topLeft = game.screen.screenToPageCoordinates(vec(0, 0));
mainScreenEl.setPos(topLeft.x, topLeft.y);

const dimensions = game.getWorldBounds();
mainScreenEl.setDimensions(dimensions.width, dimensions.height);
mainScreenEl.setPixelRatio(game.pixelRatio);
mainScreenEl.setWaveManager(waveManager);

game.screen.events.on("resize", () => {
  const topLeft = game.screen.screenToPageCoordinates(vec(0, 0));
  mainScreenEl.setPos(topLeft.x, topLeft.y);
});

//push test
