// resources.ts
import { FontSource, ImageSource, Loader, Sound, SpriteSheet } from "excalibur";

// Images0
import powertower from "./Assets/images/TeslaCoilwithTop_v2.png"; // replace this
import missleChassisImage from "./Assets/images/Drop_MissileChassis_v1.png";
import laserOpticsDrop from "./Assets/images/Drop_LaserOptics_v2.png";
import droneEngineDrop from "./Assets/images/Drop_DroneEngine_v2.png";
import rangedEnemySource from "./Assets/images/rangedEnemy-Sheet.png";
import otherTower from "./Assets/images/other tower.png";
import tankEnemySource from "./Assets/images/Tank_Animated_v5-Sheet.png";
import mute from "./Assets/images/mute.png";
import unmute from "./Assets/images/unmute.png";
import missle from "./Assets/images/Missle.png";
import drone from "./Assets/images/drone.png";
import powercore from "./Assets/images/powercore.png";

//Sounds
import cursorSound from "./Assets/sounds/cursor2.mp3";
import placeTowerSound from "./Assets/sounds/place_tower.mp3";
import selectSound from "./Assets/sounds/select2.mp3";
import tankShotSound from "./Assets/sounds/tank_shoot.mp3";
import itemPickupSound from "./Assets/sounds/item_pickup.mp3";
import missleSound from "./Assets/sounds/missile.mp3";
import sprocketSound from "./Assets/sounds/sprocket science.mp3";

//Fonts
import pixelFont from "./Assets/PressStart2P-Regular.ttf?url";

export const Resources = {
  // Font
  Font: new FontSource(pixelFont, "PressStart2P"),

  // Images
  powertower: new ImageSource(powertower),
  missleChassis: new ImageSource(missleChassisImage),
  laserOpticsDrop: new ImageSource(laserOpticsDrop),
  droneEngineDrop: new ImageSource(droneEngineDrop),
  rangedEnemySS: new ImageSource(rangedEnemySource),
  otherTower: new ImageSource(otherTower),
  tankEnemySS: new ImageSource(tankEnemySource),
  mute: new ImageSource(mute),
  unmute: new ImageSource(unmute),
  missle: new ImageSource(missle),
  drone: new ImageSource(drone),
  powercore: new ImageSource(powercore),

  // Shop
  ShopOpen: new Sound("./sounds/shop_open.mp3"),
  ShopClose: new Sound("./sounds/shop_close.mp3"),
  ShopPurchase: new Sound("./sounds/purchase.mp3"),

  // Sounds
  cursorSound: new Sound(cursorSound),
  placeTowerSound: new Sound(placeTowerSound),
  selectSound: new Sound(selectSound),
  tankShotSound: new Sound(tankShotSound),
  itemPickupSound: new Sound(itemPickupSound),
  missleSound: new Sound(missleSound),
  sprocketSound: new Sound(sprocketSound),
};

Resources.sprocketSound.loop = true;

export const loader = new Loader();

export const rangedEnemySS = SpriteSheet.fromImageSource({
  image: Resources.rangedEnemySS,
  grid: {
    rows: 3,
    columns: 4,
    spriteHeight: 64,
    spriteWidth: 64,
  },
});

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
