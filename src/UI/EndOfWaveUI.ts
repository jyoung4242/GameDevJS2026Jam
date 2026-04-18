import { vec, Color, Font, Engine } from "excalibur";
import { UILabel, UILabelConfig } from "./UI Components/uiLabel";
import { UIPanelConfig, UIPanel } from "./UI Components/uiPanel";

const panelConfig: UIPanelConfig = {
  name: "endofwavePanel",
  width: 1200,
  height: 300,
  pos: vec(350, 310),
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

export class EndOfWavePanel extends UIPanel {
  lbl1: UILabel | null = null;
  constructor() {
    super(panelConfig);

    this.lbl1 = new WaveLabelUI();
    this.addChild(this.lbl1);
  }

  onAdd(engine: Engine): void {
    setTimeout(() => {
      this.kill();
    }, 2500);
  }
}

const waveLabelUIConfig: UILabelConfig = {
  name: "WaveLabelUI",
  width: 800,
  height: 150,
  pos: vec(300, 120),
  z: 2,
  colors: {
    backgroundStarting: Color.Transparent,
  },
  text: "END OF WAVE",
  textOptions: {
    color: Color.fromHex("#c78635"),
    font: new Font({
      family: "PressStart2P",
      size: 60,
    }),
  },
  padding: vec(10, 10),
};

export class WaveLabelUI extends UILabel {
  constructor() {
    super(waveLabelUIConfig);
  }
}
