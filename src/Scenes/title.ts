import { Engine, Scene, SceneActivationContext } from "excalibur";
import { TitlePanel } from "../UI/TitleUI";
import { Resources } from "../resources";

export class TitleScene extends Scene {
  constructor() {
    super();
    this.add(new TitlePanel());
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {
    Resources.sprocketSound.loop = true;
    Resources.sprocketSound.play();
  }

  onDeactivate(context: SceneActivationContext) {
    Resources.sprocketSound.stop();
  }

  onInitialize(engine: Engine): void {}

  onPreUpdate(engine: Engine, elapsed: number): void {}
}
