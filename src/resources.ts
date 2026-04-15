// resources.ts
import { ImageSource, Loader } from "excalibur";
import powertower from "./Assets/TeslaCoilwithTop_v2.png"; // replace this
import missleChassisImage from "./Assets/Drop_MissileChassis_v1.png";
import laserOpticsDrop from "./Assets/Drop_LaserOptics_v2.png";
import droneEngineDrop from "./Assets/Drop_DroneEngine_v2.png";

export const Resources = {
  powertower: new ImageSource(powertower),
  missleChassis: new ImageSource(missleChassisImage),
  laserOpticsDrop: new ImageSource(laserOpticsDrop),
  droneEngineDrop: new ImageSource(droneEngineDrop),
};

export const loader = new Loader();

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
