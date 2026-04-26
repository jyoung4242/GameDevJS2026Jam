import { Engine, Scene, SceneActivationContext, vec } from "excalibur";
import { TitlePanel } from "../UI/TitleUI";
import { Resources } from "../resources";
import { UIMute } from "../UI/muteUI";

export class TitleScene extends Scene {
  constructor() {
    super();
    this.add(new TitlePanel());
    this.add(new UIMute(vec(765, 560)));
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
