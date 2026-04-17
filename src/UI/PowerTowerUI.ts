import { Color, Font, PointerEvent, vec } from "excalibur";
import { UIPanel, UIPanelConfig } from "./UI Components/uiPanel";
import { OtherTower, PowerPlantTower } from "../Actors/towers";
import { UILabel, UILabelConfig } from "./UI Components/uiLabel";
import { UIButton, UIButtonConfig } from "./UI Components/uiButton";
import { GameField } from "../Actors/GameField";
import { TowerManager } from "../Lib/TowerManager";

const panelConfig: UIPanelConfig = {
  name: "PowerTowerMenu",
  width: 250,
  height: 150,
  pos: vec(-275, -75),
  z: 0,
  colors: {
    backgroundStarting: Color.fromHex("#2a2724c8"),
    borderColor: Color.fromHex("#c78635c8"),
  },
  borderWidth: 3,
  panelRadius: 12,
  padding: vec(10, 10),
  visible: true,
};

export class PowerTowerMenu extends UIPanel {
  lbl1: UILabel | null = null;
  btn1: UIButton | null = null;
  constructor(owner: PowerPlantTower) {
    super(panelConfig);

    this.lbl1 = new PTLabel1();
    this.addChild(this.lbl1);
    this.btn1 = new PTButton1();
    this.addChild(this.btn1);
  }

  closeMenu() {
    this.kill();
  }
}

const PixelFont = new Font({
  family: "PressStart2P",
  size: 14,
});

const Arial = new Font({
  family: "Arial",
  size: 14,
});

const pt1labelconfig: UILabelConfig = {
  name: "PowerTowerMenu",
  width: 250,
  height: 50,
  pos: vec(3, 3),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: "Utility Tower",
  textOptions: {
    color: Color.fromHex("#c78635"),
    font: PixelFont,
  },
  padding: vec(10, 10),
};

export class PTLabel1 extends UILabel {
  constructor() {
    super(pt1labelconfig);
  }
}

const pt1ButtonConfig: UIButtonConfig = {
  name: "PowerTowerMenu",
  width: 30,
  height: 30,
  pos: vec(200, 5),
  z: 2,
  colors: {
    mainStarting: Color.fromHex("#c78635c8"),
    bottomStarting: Color.fromHex("#936833c8"),
    hoverStarting: Color.fromHex("#edaa59c8"),
    disabledStarting: Color.fromHex("#4e463cc8"),
  },
  buttonRadius: 5,
  activeText: "+",
  idleText: "+",
  hoveredText: "+",
  disabledText: "+",
  textOptions: {
    color: Color.fromHex("#e8dfd3"),
    font: PixelFont,
  },
};

export class PTButton1 extends UIButton {
  constructor() {
    super(pt1ButtonConfig);
  }

  onClick = (evt: PointerEvent) => {
    let mousePos = this.scene?.engine.input.pointers.primary.lastWorldPos;
    if (!mousePos) return;
    console.log(this.parent?.parent);

    let newTower = ((this.parent as PowerTowerMenu).parent as PowerPlantTower).tw!.createTower("other", mousePos);
    (newTower as OtherTower).isPlacing = true;
    (this.parent as PowerTowerMenu).closeMenu();
  };
}
