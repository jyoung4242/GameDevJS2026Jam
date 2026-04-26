import { Engine, Scene, SceneActivationContext } from "excalibur";
import { GameOverUI } from "../UI/GameOverUI";
import { Resources } from "../resources";

export class GameOverScene extends Scene {
  constructor() {
    super();
    this.add(new GameOverUI());
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {
    Resources.sprocketSound.play();
  }

  onDeactivate(context: SceneActivationContext) {
    Resources.sprocketSound.stop();
  }
}
