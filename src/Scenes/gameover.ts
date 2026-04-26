import { Engine, Scene, SceneActivationContext, vec } from "excalibur";
import { GameOverUI } from "../UI/GameOverUI";
import { Resources } from "../resources";
import { UIMute } from "../UI/muteUI";
import { MuteableEngine } from "../main";

export class GameOverScene extends Scene {
  constructor() {
    super();
    this.add(new GameOverUI());
    this.add(new UIMute(vec(765, 560)));
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {
    let engine = context.engine as MuteableEngine;
    if (!(engine as MuteableEngine).mute) Resources.sprocketSound.play(.1);
  }

  onDeactivate(context: SceneActivationContext) {
    Resources.sprocketSound.stop();
  }
}
