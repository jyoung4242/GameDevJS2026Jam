// main.ts
import { GameField } from "./Actors/GameField";
import { EnemyWaveController } from "./Lib/enemyWaveController";
import { TowerManager } from "./Lib/TowerManager";
import "./style.css";

import { Engine, DisplayMode, Vector, vec, Keys, KeyEvent } from "excalibur";

const game = new Engine({
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
