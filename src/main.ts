// main.ts
import "./style.css";
import { Engine, DisplayMode, SoundManager } from "excalibur";
import "./main.screen";
import { loader } from "./resources";
import { MainScene } from "./Scenes/main";
import { GameOverScene } from "./Scenes/gameover";
import { TitleScene } from "./Scenes/title";

const game = new Engine({
  canvasElementId: "game",
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelRatio: 2,
  pixelArt: true,
  scenes: {
    title: new TitleScene(),
    main: new MainScene(),
    gameover: new GameOverScene(),
  },
});

await game.start(loader);
game.goToScene("title");
