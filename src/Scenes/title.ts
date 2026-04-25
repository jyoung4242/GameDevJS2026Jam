import { Engine, Scene, SceneActivationContext } from "excalibur";
import { TitlePanel } from "../UI/TitleUI";

export class TitleScene extends Scene {
  constructor() {
    super();
    this.add(new TitlePanel());
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {}

  onInitialize(engine: Engine): void {}

  onPreUpdate(engine: Engine, elapsed: number): void {}
}
