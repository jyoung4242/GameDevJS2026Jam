// resources.ts
import { FontSource, ImageSource, Loader, Sound } from "excalibur";
import powertower from "./Assets/TeslaCoilwithTop_v2.png"; // replace this
import missleChassisImage from "./Assets/Drop_MissileChassis_v1.png";
import laserOpticsDrop from "./Assets/Drop_LaserOptics_v2.png";
import droneEngineDrop from "./Assets/Drop_DroneEngine_v2.png";
import pixelFont from './Assets/PressStart2P-Regular.ttf?url'

export const Resources = {
  // Font
  Font: new FontSource(pixelFont, "PressStart2P"),

  // Images
  powertower: new ImageSource(powertower),
  missleChassis: new ImageSource(missleChassisImage),
  laserOpticsDrop: new ImageSource(laserOpticsDrop),
  droneEngineDrop: new ImageSource(droneEngineDrop),

  // Sound Effects
  
  // Shop
  ShopOpen: new Sound('./sounds/shop_open.mp3'),
  ShopClose: new Sound('./sounds/shop_close.mp3'),
  ShopPurchase: new Sound('./sounds/purchase.mp3'),
};

export const loader = new Loader();

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
