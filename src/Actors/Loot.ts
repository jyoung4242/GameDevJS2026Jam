import { Actor, Vector, Color, CollisionType, ScreenElement, Engine, vec } from "excalibur";
import { lootColliderGroup } from "../CollisionGroups";

export class LootCollector extends Actor {
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
      .die();
  }
}
export class MissleChassis extends Loot {
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(24, 9);
    let shape: "circle" | "box" = "box";
    let color: Color = Color.DarkGray;
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class BurstShells extends Loot {
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
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(10, 10);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.Green;
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class LaserOptics extends Loot {
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(10, 10);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.fromHex("#194219");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class PowerCore extends Loot {
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(25, 25);
    let shape: "circle" | "box" = "box";
    let color: Color = Color.fromHex("#941e00");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}

export class PowerCell extends Loot {
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
  constructor() {
    let pos: Vector = new Vector(0, 0);
    let dims: Vector = new Vector(20, 20);
    let shape: "circle" | "box" = "circle";
    let color: Color = Color.fromHex("#3a74f1");
    super(pos, dims, shape);
    this.graphics.color = color;
  }
}
