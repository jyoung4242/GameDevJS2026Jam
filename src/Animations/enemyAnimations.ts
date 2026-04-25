import { ImageSource, SpriteSheet, Animation, AnimationStrategy } from "excalibur";
import { rangedEnemySS } from "../resources";

// Create spritesheet using grid-based parsing
const spriteSheet = rangedEnemySS;

// Frame graphics (with optional per-frame flipping)

const IdleLeft_Frame0Graphic = spriteSheet.sprites[0];
const IdleLeft_Frame1Graphic = spriteSheet.sprites[1];
const IdleRight_Frame0Graphic = spriteSheet.sprites[0];
const IdleRight_Frame1Graphic = spriteSheet.sprites[1];
const WalkLeft_Frame0Graphic = spriteSheet.sprites[4];
const WalkLeft_Frame1Graphic = spriteSheet.sprites[5];
const WalkLeft_Frame2Graphic = spriteSheet.sprites[6];
const WalkLeft_Frame3Graphic = spriteSheet.sprites[7];
const WalkRight_Frame0Graphic = spriteSheet.sprites[4];
const WalkRight_Frame1Graphic = spriteSheet.sprites[5];
const WalkRight_Frame2Graphic = spriteSheet.sprites[6];
const WalkRight_Frame3Graphic = spriteSheet.sprites[7];
const AttackLeft_Frame0Graphic = spriteSheet.sprites[8];
const AttackLeft_Frame1Graphic = spriteSheet.sprites[9];
const AttackLeft_Frame2Graphic = spriteSheet.sprites[8];
const AttackRight_Frame0Graphic = spriteSheet.sprites[8];
const AttackRight_Frame1Graphic = spriteSheet.sprites[9];
const AttackRight_Frame2Graphic = spriteSheet.sprites[8];

// Animation definitions

const IdleLeftBase = new Animation({
  frames: [
    { graphic: IdleLeft_Frame0Graphic, duration: 150 },
    { graphic: IdleLeft_Frame1Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const IdleLeft = IdleLeftBase;

const IdleRightBase = new Animation({
  frames: [
    { graphic: IdleRight_Frame0Graphic, duration: 150 },
    { graphic: IdleRight_Frame1Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const IdleRight = IdleRightBase.clone();
IdleRight.flipHorizontal = true;

const WalkLeftBase = new Animation({
  frames: [
    { graphic: WalkLeft_Frame0Graphic, duration: 150 },
    { graphic: WalkLeft_Frame1Graphic, duration: 150 },
    { graphic: WalkLeft_Frame2Graphic, duration: 150 },
    { graphic: WalkLeft_Frame3Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const WalkLeft = WalkLeftBase;

const WalkRightBase = new Animation({
  frames: [
    { graphic: WalkRight_Frame0Graphic, duration: 150 },
    { graphic: WalkRight_Frame1Graphic, duration: 150 },
    { graphic: WalkRight_Frame2Graphic, duration: 150 },
    { graphic: WalkRight_Frame3Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Loop,
});

const WalkRight = WalkRightBase.clone();
WalkRight.flipHorizontal = true;

const AttackLeftBase = new Animation({
  frames: [
    { graphic: AttackLeft_Frame0Graphic, duration: 150 },
    { graphic: AttackLeft_Frame1Graphic, duration: 150 },
    { graphic: AttackLeft_Frame2Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Freeze,
});

const AttackLeft = AttackLeftBase;

const AttackRightBase = new Animation({
  frames: [
    { graphic: AttackRight_Frame0Graphic, duration: 150 },
    { graphic: AttackRight_Frame1Graphic, duration: 150 },
    { graphic: AttackRight_Frame2Graphic, duration: 150 },
  ],
  strategy: AnimationStrategy.Freeze,
});

const AttackRight = AttackRightBase.clone();
AttackRight.flipHorizontal = true;

export const RangedEnemyAnimation = {
  IdleLeft,
  IdleRight,
  WalkLeft,
  WalkRight,
  AttackLeft,
  AttackRight,
};
