// main.ts
import { GameField } from "./Actors/GameField";
import { EnemyWaveController } from "./Lib/enemyWaveController";
import { TowerManager } from "./Lib/TowerManager";
import "./style.css";

import { Engine, DisplayMode, Vector, vec, Keys, KeyEvent } from "excalibur";

import './main.screen';
import { MainScreen } from "./main.screen";

// TODO move to scene
const mainScreenEl = document.getElementsByTagName('main-screen')[0]! as MainScreen;
mainScreenEl.visible = true;

const game = new Engine({
  canvasElementId: 'game',
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
});

await game.start();

let gField = new GameField(Vector.Zero, vec(1800, 1000));
game.add(gField);

let towerManager = new TowerManager(gField);
let waveManager = new EnemyWaveController(towerManager, gField);
waveManager.init();
towerManager.createTower("power", new Vector(900, 500));
gField.registerWaveManager(waveManager);
gField.registerTowerManager(towerManager);
towerManager.registerEWC(waveManager);

console.log("Hit Spacebar to begin wave");

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

