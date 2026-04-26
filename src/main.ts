// main.ts
import "./style.css";
import { Engine, DisplayMode, Color, Resource } from "excalibur";
import "./main.screen";
import { loader, Resources } from "./resources";
import { MainScene } from "./Scenes/main";
import { GameOverScene } from "./Scenes/gameover";
import { TitleScene } from "./Scenes/title";
import { JsfxrResource } from "@excaliburjs/plugin-jsfxr";
import { sounds } from "./Assets/sounds/sounds";
import { MuteManager } from "./UI/muteUI";

export let sndPlugin = new JsfxrResource();
sndPlugin.init(); //initializes the JSFXR library
for (const sound in sounds) {
  sndPlugin.loadSoundConfig(sound, sounds[sound]);
}

MuteManager.init();

export class MuteableEngine extends Engine {
  muteState: boolean = false;

  constructor(config: any) {
    super(config);
  }

  set mute(state: boolean) {
    this.muteState = state;
    if (state) {
      Resources.sprocketSound.stop();
    } else {
      Resources.sprocketSound.play();
    }
  }

  get mute(): boolean {
    return this.muteState;
  }
}

const game = new MuteableEngine({
  canvasElementId: "game",
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelRatio: 2,
  pixelArt: true,
  backgroundColor: Color.fromHex("#3b3838"),
  scenes: {
    title: new TitleScene(),
    main: new MainScene(),
    gameover: new GameOverScene(),
  },
});

await game.start(loader);
game.goToScene("title");
