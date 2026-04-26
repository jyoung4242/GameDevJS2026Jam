import { SpriteSheet, Animation, AnimationStrategy } from "excalibur";
import { Resources } from "../resources";

// Create spritesheet using grid-based parsing
const spriteSheet = SpriteSheet.fromImageSource({
  image: Resources.tankEnemySS,
  grid: {
    rows: 6,
    columns: 8,
    spriteWidth: 128,
    spriteHeight: 128,
  },
});

// Frame graphics (with optional per-frame flipping)

const LeftDown_Frame0Graphic = spriteSheet.sprites[0];
const LeftDown_Frame1Graphic = spriteSheet.sprites[1];
const LeftDown_Frame2Graphic = spriteSheet.sprites[2];
const LeftDown_Frame3Graphic = spriteSheet.sprites[3];
const LeftDown_Frame4Graphic = spriteSheet.sprites[4];
const LeftDown_Frame5Graphic = spriteSheet.sprites[5];
const LeftDown_Frame6Graphic = spriteSheet.sprites[6];
const LeftDown_Frame7Graphic = spriteSheet.sprites[7];
const RightDown_Frame0Graphic = spriteSheet.sprites[8];
const RightDown_Frame1Graphic = spriteSheet.sprites[9];
const RightDown_Frame2Graphic = spriteSheet.sprites[10];
const RightDown_Frame3Graphic = spriteSheet.sprites[11];
const RightDown_Frame4Graphic = spriteSheet.sprites[12];
const RightDown_Frame5Graphic = spriteSheet.sprites[13];
const RightDown_Frame6Graphic = spriteSheet.sprites[14];
const RightDown_Frame7Graphic = spriteSheet.sprites[15];
const Down_Frame0Graphic = spriteSheet.sprites[16];
const Down_Frame1Graphic = spriteSheet.sprites[17];
const Down_Frame2Graphic = spriteSheet.sprites[18];
const Down_Frame3Graphic = spriteSheet.sprites[19];
const Down_Frame4Graphic = spriteSheet.sprites[20];
const Down_Frame5Graphic = spriteSheet.sprites[21];
const Down_Frame6Graphic = spriteSheet.sprites[22];
const Down_Frame7Graphic = spriteSheet.sprites[23];
const Up_Frame0Graphic = spriteSheet.sprites[24];
const Up_Frame1Graphic = spriteSheet.sprites[25];
const Up_Frame2Graphic = spriteSheet.sprites[26];
const Up_Frame3Graphic = spriteSheet.sprites[27];
const Up_Frame4Graphic = spriteSheet.sprites[28];
const Up_Frame5Graphic = spriteSheet.sprites[29];
const Up_Frame6Graphic = spriteSheet.sprites[30];
const Up_Frame7Graphic = spriteSheet.sprites[31];
const LeftUp_Frame0Graphic = spriteSheet.sprites[32];
const LeftUp_Frame1Graphic = spriteSheet.sprites[33];
const LeftUp_Frame2Graphic = spriteSheet.sprites[34];
const LeftUp_Frame3Graphic = spriteSheet.sprites[35];
const LeftUp_Frame4Graphic = spriteSheet.sprites[36];
const LeftUp_Frame5Graphic = spriteSheet.sprites[37];
const LeftUp_Frame6Graphic = spriteSheet.sprites[38];
const LeftUp_Frame7Graphic = spriteSheet.sprites[39];
const RightUp_Frame0Graphic = spriteSheet.sprites[32];
const RightUp_Frame1Graphic = spriteSheet.sprites[33];
const RightUp_Frame2Graphic = spriteSheet.sprites[34];
const RightUp_Frame3Graphic = spriteSheet.sprites[35];
const RightUp_Frame4Graphic = spriteSheet.sprites[36];
const RightUp_Frame5Graphic = spriteSheet.sprites[37];
const RightUp_Frame6Graphic = spriteSheet.sprites[38];
const RightUp_Frame7Graphic = spriteSheet.sprites[39];
const Left_Frame0Graphic = spriteSheet.sprites[40];
const Left_Frame1Graphic = spriteSheet.sprites[41];
const Left_Frame2Graphic = spriteSheet.sprites[42];
const Left_Frame3Graphic = spriteSheet.sprites[43];
const Left_Frame4Graphic = spriteSheet.sprites[44];
const Left_Frame5Graphic = spriteSheet.sprites[45];
const Left_Frame6Graphic = spriteSheet.sprites[46];
const Left_Frame7Graphic = spriteSheet.sprites[47];
const Right_Frame0Graphic = spriteSheet.sprites[40];
const Right_Frame1Graphic = spriteSheet.sprites[41];
const Right_Frame2Graphic = spriteSheet.sprites[42];
const Right_Frame3Graphic = spriteSheet.sprites[43];
const Right_Frame4Graphic = spriteSheet.sprites[44];
const Right_Frame5Graphic = spriteSheet.sprites[45];
const Right_Frame6Graphic = spriteSheet.sprites[46];
const Right_Frame7Graphic = spriteSheet.sprites[47];

// Animation definitions

const LeftDownBase = new Animation({
  frames: [
    { graphic: LeftDown_Frame0Graphic, duration: 150 },
    { graphic: LeftDown_Frame1Graphic, duration: 150 },
    { graphic: LeftDown_Frame2Graphic, duration: 150 },
    { graphic: LeftDown_Frame3Graphic, duration: 150 },
    { graphic: LeftDown_Frame4Graphic, duration: 150 },
    { graphic: LeftDown_Frame5Graphic, duration: 150 },
    { graphic: LeftDown_Frame6Graphic, duration: 150 },
    { graphic: LeftDown_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const LeftDown = LeftDownBase;

const RightDownBase = new Animation({
  frames: [
    { graphic: RightDown_Frame0Graphic, duration: 150 },
    { graphic: RightDown_Frame1Graphic, duration: 150 },
    { graphic: RightDown_Frame2Graphic, duration: 150 },
    { graphic: RightDown_Frame3Graphic, duration: 150 },
    { graphic: RightDown_Frame4Graphic, duration: 150 },
    { graphic: RightDown_Frame5Graphic, duration: 150 },
    { graphic: RightDown_Frame6Graphic, duration: 150 },
    { graphic: RightDown_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const RightDown = RightDownBase;

const DownBase = new Animation({
  frames: [
    { graphic: Down_Frame0Graphic, duration: 150 },
    { graphic: Down_Frame1Graphic, duration: 150 },
    { graphic: Down_Frame2Graphic, duration: 150 },
    { graphic: Down_Frame3Graphic, duration: 150 },
    { graphic: Down_Frame4Graphic, duration: 150 },
    { graphic: Down_Frame5Graphic, duration: 150 },
    { graphic: Down_Frame6Graphic, duration: 150 },
    { graphic: Down_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const Down = DownBase;

const UpBase = new Animation({
  frames: [
    { graphic: Up_Frame0Graphic, duration: 150 },
    { graphic: Up_Frame1Graphic, duration: 150 },
    { graphic: Up_Frame2Graphic, duration: 150 },
    { graphic: Up_Frame3Graphic, duration: 150 },
    { graphic: Up_Frame4Graphic, duration: 150 },
    { graphic: Up_Frame5Graphic, duration: 150 },
    { graphic: Up_Frame6Graphic, duration: 150 },
    { graphic: Up_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const Up = UpBase;

const LeftUpBase = new Animation({
  frames: [
    { graphic: LeftUp_Frame0Graphic, duration: 150 },
    { graphic: LeftUp_Frame1Graphic, duration: 150 },
    { graphic: LeftUp_Frame2Graphic, duration: 150 },
    { graphic: LeftUp_Frame3Graphic, duration: 150 },
    { graphic: LeftUp_Frame4Graphic, duration: 150 },
    { graphic: LeftUp_Frame5Graphic, duration: 150 },
    { graphic: LeftUp_Frame6Graphic, duration: 150 },
    { graphic: LeftUp_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const LeftUp = LeftUpBase;

const RightUpBase = new Animation({
  frames: [
    { graphic: RightUp_Frame0Graphic, duration: 150 },
    { graphic: RightUp_Frame1Graphic, duration: 150 },
    { graphic: RightUp_Frame2Graphic, duration: 150 },
    { graphic: RightUp_Frame3Graphic, duration: 150 },
    { graphic: RightUp_Frame4Graphic, duration: 150 },
    { graphic: RightUp_Frame5Graphic, duration: 150 },
    { graphic: RightUp_Frame6Graphic, duration: 150 },
    { graphic: RightUp_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const RightUp = RightUpBase.clone();
RightUp.flipHorizontal = true;

const LeftBase = new Animation({
  frames: [
    { graphic: Left_Frame0Graphic, duration: 150 },
    { graphic: Left_Frame1Graphic, duration: 150 },
    { graphic: Left_Frame2Graphic, duration: 150 },
    { graphic: Left_Frame3Graphic, duration: 150 },
    { graphic: Left_Frame4Graphic, duration: 150 },
    { graphic: Left_Frame5Graphic, duration: 150 },
    { graphic: Left_Frame6Graphic, duration: 150 },
    { graphic: Left_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const Left = LeftBase;

const RightBase = new Animation({
  frames: [
    { graphic: Right_Frame0Graphic, duration: 150 },
    { graphic: Right_Frame1Graphic, duration: 150 },
    { graphic: Right_Frame2Graphic, duration: 150 },
    { graphic: Right_Frame3Graphic, duration: 150 },
    { graphic: Right_Frame4Graphic, duration: 150 },
    { graphic: Right_Frame5Graphic, duration: 150 },
    { graphic: Right_Frame6Graphic, duration: 150 },
    { graphic: Right_Frame7Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const Right = RightBase.clone();
Right.flipHorizontal = true;

export const TankEnemyAnimations = {
  LeftDown,
  RightDown,
  Down,
  Up,
  LeftUp,
  RightUp,
  Left,
  Right,
};
