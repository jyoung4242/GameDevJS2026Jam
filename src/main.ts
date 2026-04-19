// main.ts
import "./style.css";
import { Engine, DisplayMode } from "excalibur";
import "./main.screen";
import { loader } from "./resources";
import { MainScene } from "./Scenes/main";

const game = new Engine({
  canvasElementId: "game",
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelRatio: 2,
  pixelArt: true,
  scenes: {
    main: new MainScene(),
  },
});

await game.start(loader);
game.goToScene("main");
