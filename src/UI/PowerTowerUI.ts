import { Color, Engine, Font, KeyEvent, PointerEvent, PointerEvents, Subscription, vec } from "excalibur";
import { UIPanel, UIPanelConfig } from "./UI Components/uiPanel";
import { OtherTower, PowerPlantTower } from "../Actors/towers";
import { UILabel, UILabelConfig } from "./UI Components/uiLabel";
import { UIButton, UIButtonConfig } from "./UI Components/uiButton";
import { GameField } from "../Actors/GameField";
import { TowerManager } from "../Lib/TowerManager";
import { MainScene } from "../Scenes/main";

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
  lbl2: UILabel | null = null;
  btn2: UIButton | null = null;
  constructor(owner: PowerPlantTower) {
    super(panelConfig);

    this.lbl1 = new PTLabel1();
    this.addChild(this.lbl1);
    this.btn1 = new PTButton1();
    this.addChild(this.btn1);
    this.lbl2 = new PTLabel2();
    this.addChild(this.lbl2);
    this.btn2 = new PTButton2();
    this.addChild(this.btn2);
  }

  closeMenu() {
    // manage this.parent as null
    if (this.parent) (this.parent as PowerPlantTower).isUIShowing = false;
    this.kill();
  }
}

const PixelFont = new Font({
  family: "PressStart2P",
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
  callback: (evt: PointerEvent | KeyEvent, button: UIButton) => {
    let powerTowerParent = (button.parent as PowerTowerMenu).parent as PowerPlantTower;

    //check how many towers are tied to parent
    if (powerTowerParent.otherTowers.length >= 3) {
      return;
    }

    let mousePos = button.scene?.engine.input.pointers.primary.lastWorldPos;
    if (!mousePos) return;

    let newTower: OtherTower = ((button.parent as PowerTowerMenu).parent as PowerPlantTower).tw!.createTower(
      "other",
      mousePos,
      powerTowerParent,
    ) as OtherTower;
    (newTower as OtherTower).isPlacing = true;
    powerTowerParent.otherTowers.push(newTower);
    (button.parent as PowerTowerMenu).closeMenu();
  },
};

export class PTButton1 extends UIButton {
  closeHandler: Subscription | null = null;
  constructor() {
    super(pt1ButtonConfig);
  }
  onAdd(engine: Engine): void {
    super.onAdd(engine);

    let powerTowerParent = (this.parent as PowerTowerMenu).parent as PowerPlantTower;

    //check how many towers are tied to parent
    if (powerTowerParent.otherTowers.length >= 3) {
      this.setEnabled(false);
    }

    this.closeHandler = powerTowerParent.tw.gf.on("pointerdown", (evt: PointerEvent) => {
      //check if click location is outside of menu
      if (!(this.parent as PowerTowerMenu).contains(evt.worldPos.x, evt.worldPos.y, true)) {
        (this.parent as PowerTowerMenu).closeMenu();
      }
    });
  }

  onRemove(engine: Engine): void {
    super.onRemove(engine);
    setTimeout(() => {
      if (this.closeHandler) this.closeHandler.close();
    }, 250);
  }
}

const pt2labelconfig: UILabelConfig = {
  name: "PowerTowerMenu",
  width: 250,
  height: 50,
  pos: vec(3, 60),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: "Repair Towers",
  textOptions: {
    color: Color.fromHex("#c78635"),
    font: PixelFont,
  },
  padding: vec(10, 10),
};

export class PTLabel2 extends UILabel {
  constructor() {
    super(pt2labelconfig);
  }
}

const pt2ButtonConfig: UIButtonConfig = {
  name: "PowerTowerMenu",
  width: 30,
  height: 30,
  pos: vec(200, 60),
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
  callback: (evt: PointerEvent | KeyEvent, button: UIButton) => {
    const powerTowerParent = (button.parent as PowerTowerMenu).parent as PowerPlantTower;
    const sceneCables = (powerTowerParent.scene as MainScene).Cables;

    // Find all broken cables owned by this tower and repair them
    for (const myCableActor of sceneCables) {
      if (!myCableActor.isPowered && myCableActor.fromTower === powerTowerParent) {
        const success = myCableActor.repairCable();
      }
    }
    (button.parent as PowerTowerMenu).closeMenu();
  },
};

export class PTButton2 extends UIButton {
  closeHandler: Subscription | null = null;
  constructor() {
    super(pt2ButtonConfig);
  }
  onAdd(engine: Engine): void {
    super.onAdd(engine);

    let powerTowerParent = (this.parent as PowerTowerMenu).parent as PowerPlantTower;

    // check if power tower has any broken towers
    const sceneCables = (powerTowerParent.scene as MainScene).Cables;
    const hasOwnedBrokenCable = sceneCables.some(c => !c.isPowered && c.fromTower === powerTowerParent);
    if (!hasOwnedBrokenCable) this.setEnabled(false);

    this.closeHandler = powerTowerParent.tw.gf.on("pointerdown", (evt: PointerEvent) => {
      //check if click location is outside of menu
      if (!(this.parent as PowerTowerMenu).contains(evt.worldPos.x, evt.worldPos.y, true)) {
        (this.parent as PowerTowerMenu).closeMenu();
      }
    });
  }

  onRemove(engine: Engine): void {
    super.onRemove(engine);
    setTimeout(() => {
      if (this.closeHandler) this.closeHandler.close();
    }, 250);
  }
}
