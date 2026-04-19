import { vec, Color, Engine, Font, Vector, KeyEvent, PointerEvent } from "excalibur";
import { UIButton, UIButtonConfig } from "./UI Components/uiButton";
import { UILabel, UILabelConfig } from "./UI Components/uiLabel";
import { UIPanel, UIPanelConfig } from "./UI Components/uiPanel";

const goPanelUIConfig: UIPanelConfig = {
  name: "gameoverPanel",
  width: 600,
  height: 400,
  pos: vec(100, 100),
  z: 100,
  colors: {
    backgroundStarting: Color.fromHex("#2a2724c8"),
    borderColor: Color.fromHex("#c78635c8"),
  },
  borderWidth: 3,
  panelRadius: 12,
  padding: vec(10, 10),
  visible: true,
};

export class GameOverUI extends UIPanel {
  constructor() {
    super(goPanelUIConfig);
    this.anchor = Vector.Zero;
  }

  onInitialize(engine: Engine): void {
    this.addChild(new GameOverTitle());
    this.addChild(new GameOverSubTitle());
    this.addChild(new GameOverButton());
  }
}

const gameOverLabelConfig: UILabelConfig = {
  name: "gameOverLabel",
  width: 300,
  height: 50,
  pos: vec(160, 30),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: `Game Over`,
  textOptions: {
    color: Color.White,
    font: new Font({
      family: "PressStart2P",
      size: 30,
    }),
  },
};
class GameOverTitle extends UILabel {
  constructor() {
    super(gameOverLabelConfig);
  }
}

const gameOverSubTitleConfig: UILabelConfig = {
  name: "gameOverSubLabel",
  width: 500,
  height: 50,
  pos: vec(90, 100),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: `Would you like to try again?`,
  textOptions: {
    color: Color.White,
    font: new Font({
      family: "PressStart2P",
      size: 15,
    }),
  },
};

class GameOverSubTitle extends UILabel {
  constructor() {
    super(gameOverSubTitleConfig);
  }
}

const gameOverButtonConfig: UIButtonConfig = {
  name: "gameOverButton",
  width: 200,
  height: 80,
  pos: vec(200, 200),
  z: 2,
  colors: {
    mainStarting: Color.fromHex("#c78635c8"),
    bottomStarting: Color.fromHex("#936833c8"),
    hoverStarting: Color.fromHex("#edaa59c8"),
    disabledStarting: Color.fromHex("#4e463cc8"),
  },
  buttonRadius: 5,
  activeText: "Play Again",
  idleText: "Play Again",
  hoveredText: "Play Again",
  disabledText: "Play Again",
  textOptions: {
    color: Color.fromHex("#e8dfd3"),
    font: new Font({
      family: "PressStart2P",
      size: 30,
    }),
  },
  callback: (evt: PointerEvent | KeyEvent, button: UIButton) => {
    button.scene?.engine.goToScene("main");
  },
};

class GameOverButton extends UIButton {
  constructor() {
    super(gameOverButtonConfig);
  }
}
