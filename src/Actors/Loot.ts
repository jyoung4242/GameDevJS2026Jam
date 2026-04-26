import { Actor, Vector, Color, CollisionType, ScreenElement, Engine, vec, GameEvent, EventEmitter } from "excalibur";
import { lootColliderGroup } from "../CollisionGroups";
import { Resources } from "../resources";
import { sndPlugin } from "../main";

export type LootCollectionEvents = {
  LootCollected: LootCollectedEvent;
  Money: number;
};

export type LootType = keyof typeof LootType;

export const LootType = {
  missleChassis: "missleChassis",
  laserOptics: "laserOptics",
  droneEngine: "droneEngine",
  burstShells: "burstShells",
  powerCore: "powerCore",
  powerCell: "powerCell",
  servos: "servos",
} as const;

export class LootCollector extends Actor {
  eventEmitter: EventEmitter<LootCollectionEvents> = new EventEmitter<LootCollectionEvents>();
  constructor() {
    super({
      pos: vec(1760, 20),
      width: 30,
      height: 30,
      color: Color.Transparent,
    });
  }
}

export abstract class Loot extends Actor {
  constructor(pos: Vector, dims: Vector, shape: "circle" | "box" = "box") {
    if (shape === "circle")
      super({
        pos,
        radius: dims.x / 2,
        color: Color.Transparent,
        collisionType: CollisionType.Passive,
        collisionGroup: lootColliderGroup,
      });
    else
      super({
        pos,
        width: dims.x,
        height: dims.y,
        color: Color.Transparent,
        collisionType: CollisionType.Passive,
        collisionGroup: lootColliderGroup,
      });
  }

  onAdd(engine: Engine): void {
    setTimeout(() => {
      this.collect();
    }, 2000);
  }

  collect() {
    // move to LootCollector and kill
    let lootCollector = this.scene?.entities.find(e => e instanceof LootCollector);
    this.actions
      .moveTo({
        duration: 750,
        pos: lootCollector?.pos ?? Vector.Zero,
      })
      .callMethod(() => {
        // sndPlugin.playSound("pickup");
        Resources.itemPickupSound.play(0.3);
        lootCollector?.eventEmitter.emit("LootCollected", this);
      })

      .die();
  }
}
export class MissleChassis extends Loot {
  sellValue: number = 10;
  name: string = "Missle Chassis";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(64, 64);
    let shape: "circle" | "box" = "box";
    let color: Color = Color.DarkGray;
    super(pos, dims, shape);
    this.graphics.use(Resources.missleChassis.toSprite());
  }
}

export class BurstShells extends Loot {
  sellValue: number = 5;
  name: string = "Burst Shells";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(10, 10);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.fromHex("#3f1414");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class DroneEngine extends Loot {
  sellValue: number = 10;
  name: string = "Drone Engine";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(32, 32);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.Green;
    super(pos, dims, shape);
    this.graphics.use(Resources.droneEngineDrop.toSprite());
  }
}

export class LaserOptics extends Loot {
  sellValue: number = 10;
  name: string = "Laser Optics";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(32, 32);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.fromHex("#194219");
    super(pos, dims, shape);
    this.graphics.use(Resources.laserOpticsDrop.toSprite());
  }
}

export class PowerCore extends Loot {
  name: string = "Power Core";
  sellValue: number = 10;
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(25, 25);
    let shape: "circle" | "box" = "box";
    let color: Color = Color.fromHex("#941e00");
    super(pos, dims, shape);
    // this.graphics.color = color;
    this.graphics.use(Resources.powercore.toSprite());
  }
}

export class PowerCell extends Loot {
  sellValue: number = 5;
  name: string = "Power Cell";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(20, 20);
    let shape: "circle" | "box" = "box";
    let color: Color = Color.fromHex("#b44f36");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class Servos extends Loot {
  sellValue: number = 8;
  name: string = "Servos";
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(20, 20);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.fromHex("#3a74f1");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class LootCollectedEvent extends GameEvent<LootCollectionEvents> {
  constructor(public loot: LootType) {
    super();
  }
}
