import { Engine, Scene } from "excalibur";
import { GameOverUI } from "../UI/GameOverUI";

export class GameOverScene extends Scene {
  constructor() {
    super();
    this.add(new GameOverUI());
  }
}
