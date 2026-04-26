import { vec, Color, Font, KeyEvent, PointerEvent } from "excalibur";
import { UIPanel, UIPanelConfig } from "./UI Components/uiPanel";
import { UIButtonConfig, UIButton } from "./UI Components/uiButton";
import { UILabel, UILabelConfig } from "./UI Components/uiLabel";
import { Resources } from "../resources";

const TitlePanelUIConfig: UIPanelConfig = {
  name: "titlePanel",
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

export class TitlePanel extends UIPanel {
  constructor(muteState: boolean = false) {
    super(TitlePanelUIConfig);
    this.addChild(new TitleButton());
    this.addChild(new titleLabel());
    this.addChild(HowToPlay);
  }
}

const TitleButtonConfig: UIButtonConfig = {
  name: "titleButton",
  width: 200,
  height: 80,
  pos: vec(200, 280),
  z: 2,
  colors: {
    mainStarting: Color.fromHex("#c78635c8"),
    bottomStarting: Color.fromHex("#936833c8"),
    hoverStarting: Color.fromHex("#edaa59c8"),
    disabledStarting: Color.fromHex("#4e463cc8"),
  },
  buttonRadius: 5,
  activeText: "Start",
  idleText: "Start",
  hoveredText: "Start",
  disabledText: "Start",
  textOptions: {
    color: Color.fromHex("#e8dfd3"),
    font: new Font({
      family: "PressStart2P",
      size: 30,
    }),
  },
  callback: (evt: PointerEvent | KeyEvent, button: UIButton) => {
    Resources.selectSound.play(.3);
    button.scene?.engine.goToScene("main");
  },
};

class TitleButton extends UIButton {
  constructor() {
    super(TitleButtonConfig);
  }
}

const titleLabelConfig: UILabelConfig = {
  name: "titleLabel",
  width: 650,
  height: 100,
  pos: vec(15, 30),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: `THE LAST STAND`,
  textOptions: {
    color: Color.White,
    font: new Font({
      family: "PressStart2P",
      size: 40,
    }),
  },
};

class titleLabel extends UILabel {
  constructor() {
    super(titleLabelConfig);
  }
}

const stringHowtoPlay = `
How to play: 
Game is a Tower Defense game where you must protect the base from waves of enemies.

Controls:
Power Tower -> click and hold to bring up menu, then select Other tower to place tower
Click to select placement of Tower, you cannot place on stone (gray tiles)

Wave starts when you click 'Start Wave' button
`;

//How to Play label
const howToPlay: UILabelConfig = {
  name: "howToPlay",
  width: 600,
  height: 400,
  pos: vec(15, 80),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: stringHowtoPlay,
  textOptions: {
    color: Color.White,
    font: new Font({
      family: "PressStart2P",
      size: 12,
    }),
  },
};

const HowToPlay = new UILabel(howToPlay);
