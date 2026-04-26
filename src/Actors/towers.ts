import { Actor, Color, Engine, ExcaliburGraphicsContext, GameEvent, Graphic, PointerEvent, vec, Vector } from "excalibur";
import { towerColliderGroup } from "../CollisionGroups";
import { TowerDamagedEvent, TowerDestroyedEvent, TowerManager } from "../Lib/TowerManager";
import { BurstTowerSkill, HomingMissileTowerSkill, LaserBeamTowerSkill, LaunchDroneSkill, TowerSkill } from "../Lib/TowerSkills";
import { Resources } from "../resources";
import { PowerTowerMenu } from "../UI/PowerTowerUI";
import { WeaponTypes } from "../Lib/enemyWaveController";
import { TILE_SIZE } from "./GameField";
import { HoldRingActor } from "./HoldRing";
import { sndPlugin } from "../main";

export const STARTING_TOWER_CAPACITY = 3;

export abstract class Tower extends Actor {
  healthBar: HealthBar;
  tw: TowerManager;

  constructor(pos: Vector, manager: TowerManager) {
    super({ pos, width: 32, height: 96, color: Color.Transparent, collisionGroup: towerColliderGroup, z: 2 });
    this.tw = manager;
    this.healthBar = new HealthBar(vec(0, -60), vec(64, 32), 100);
    this.addChild(this.healthBar);
  }

  takeDamage(damageAmount: number) {
    this.healthBar.takeDamage(damageAmount);
    this.tw.towerEmitter.emit("towerDamaged", new TowerDamagedEvent(this));
    //renew health as a part of the demo
    if (this.healthBar.currentHealth <= 0) {
      sndPlugin.playSound("towerdeath");
      this.tw.destroyTower(this);
      this.kill();
    }
  }
}

export class PowerPlantTower extends Tower {
  // Tap/Hold config
  private _holdDuration: number = 500; // ms to qualify as a hold
  private _holdTimer: number | null = null;
  private _holdFired: boolean = false;
  skillComponents: TowerSkill[] = [];
  ui: PowerTowerMenu | null = null;
  manager: TowerManager;
  otherTowers: OtherTower[] = [];
  isHolding: boolean = false;
  holdingRing: HoldRingActor | null = null;
  isUIShowing: boolean = false;

  private _numTowerCapacity: number = STARTING_TOWER_CAPACITY;
  constructor(pos: Vector, manager: TowerManager) {
    super(pos, manager);
    this.graphics.use(Resources.powertower.toSprite());
    this.manager = manager;
  }

  onInitialize(engine: Engine): void {
    super.onInitialize(engine);
    this.on("pointerdown", () => {
      if (this.isUIShowing) return;
      this._holdFired = false;
      this.isHolding = true;
      this.holdingRing = new HoldRingActor();
      this.addChild(this.holdingRing);
      this._holdTimer = window.setTimeout(() => {
        this._holdFired = true;
        this.onHold?.();
      }, this._holdDuration);
    });

    this.on("pointerup", () => {
      this.isHolding = false;
      if (this.holdingRing) {
        this.holdingRing.kill();
        this.holdingRing = null;
      }

      if (this._holdTimer !== null) {
        clearTimeout(this._holdTimer);
        this._holdTimer = null;
      }

      if (!this._holdFired) {
        this.onTap?.();
      }
    });

    const gameMain = document.getElementsByTagName("main")[0];
    this.on("pointerenter", () => {
      gameMain.style.cursor = "pointer";
    });

    this.on("pointermove", () => {
      gameMain.style.cursor = "pointer";
    });

    this.on("pointerleave", () => {
      gameMain.style.cursor = "auto";
      if (this._holdTimer !== null) {
        clearTimeout(this._holdTimer);
        this._holdTimer = null;
        this._holdFired = false;
      }
    });
  }

  onTap = () => {};
  onHold = () => {
    this.ui = new PowerTowerMenu(this);
    this.isUIShowing = true;
    this.addChild(this.ui);
    this.isHolding = false;
    //remove holding ring
    this.holdingRing?.kill();
    this.holdingRing = null;
  };

  onAdd(engine: Engine): void {
    let bt = new BurstTowerSkill(this.manager.ewc!);
    this.skillComponents.push(bt);
    this.addComponent(this.skillComponents[0]);
    bt.setState("active");

    this.tw.towerEmitter.on("towerDestroyed", this.handleTowerDestroyed);
  }

  onRemove(engine: Engine): void {
    this.tw.towerEmitter.off("towerDestroyed", this.handleTowerDestroyed);
  }

  handleTowerDestroyed = (e: TowerDestroyedEvent) => {
    if (e.tower instanceof OtherTower && this.otherTowers.includes(e.tower)) {
      this.otherTowers = this.otherTowers.filter(t => t !== e.tower);
    }
  };

  assignOtherTower(tower: OtherTower): boolean {
    if (this.otherTowers.length >= this._numTowerCapacity) return false;
    this.otherTowers.push(tower);
    return true;
  }

  clearOtherTower(tower: OtherTower) {
    this.otherTowers = this.otherTowers.filter(t => t !== tower);
  }

  getNumTowerCapacity() {
    return this._numTowerCapacity;
  }

  get numOtherTowers() {
    return this.otherTowers.length;
  }
}

export class OtherTower extends Tower {
  powerTower?: PowerPlantTower;
  status: "powered" | "unpowered" = "powered";
  oldStatus: "powered" | "unpowered" = "unpowered";
  manager: TowerManager;
  skillComponents: Map<WeaponTypes, TowerSkill> = new Map();
  direction: Vector = new Vector(0, 0);
  _isPlacing: boolean = false;

  constructor(pos: Vector, manager: TowerManager, powerTower?: PowerPlantTower) {
    super(pos, manager);
    this.graphics.use(Resources.otherTower.toSprite());
    this.powerTower = powerTower;
    this.manager = manager;
  }

  clickHandler = (evt: PointerEvent) => {
    const tileX = Math.floor(evt.worldPos.x / TILE_SIZE);
    const tileY = Math.floor(evt.worldPos.y / TILE_SIZE);
    const tile = this.tw.gf.tilemap.getTile(tileX, tileY);

    if (tile && tile.solid) {
      this.actions.flash(Color.Red, 500);
      return;
    }
    if (this._isPlacing) {
      this._isPlacing = false;
      this.pos = evt.worldPos;
      Resources.placeTowerSound.play();
    } else {
      this.manager.towerEmitter.emit("towerSelected", this);
    }
  };

  onInitialize(engine: Engine): void {
    const gameMain = document.getElementsByTagName("main")[0];
    this.on("pointerenter", () => {
      gameMain.style.cursor = "pointer";
    });

    this.on("pointermove", () => {
      gameMain.style.cursor = "pointer";
    });

    this.on("pointerleave", () => {
      gameMain.style.cursor = "auto";
    });
  }

  addSkill(skillString: WeaponTypes) {
    //get current skill
    let skill = this.skillComponents.get(skillString)!;
    skill.levelUp();
  }

  removeSkill(skillString: WeaponTypes) {
    let skill = this.skillComponents.get(skillString)!;
    skill.levelDown();
  }

  onAdd(engine: Engine): void {
    this.skillComponents.set("burst", new BurstTowerSkill(this.manager.ewc!));
    this.skillComponents.set("missle", new HomingMissileTowerSkill(this.manager.ewc!));
    this.skillComponents.set("drone", new LaunchDroneSkill(this.manager.ewc!));
    this.skillComponents.set("beam", new LaserBeamTowerSkill(this.manager.ewc!));

    this.addComponent(this.skillComponents.get("burst")!);
    this.addComponent(this.skillComponents.get("missle")!);
    this.addComponent(this.skillComponents.get("beam")!);
    this.addComponent(this.skillComponents.get("drone")!);

    // set 'burst' to active
    (this.skillComponents.get("burst") as BurstTowerSkill).setState("inactive");
    (this.skillComponents.get("missle") as BurstTowerSkill).setState("active");
    (this.skillComponents.get("drone") as BurstTowerSkill).setState("inactive");
    (this.skillComponents.get("beam") as BurstTowerSkill).setState("inactive");

    let entities = engine.currentScene.entities;
    //find power plant

    let pplants = entities.filter(e => e instanceof PowerPlantTower);
    // get closest plant
    let closestPlant = undefined;
    let closestDistance = Infinity;
    for (const pplant of pplants) {
      let distance = pplant.pos.distance(this.pos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlant = pplant;
      }
    }
    this.direction = this.pos.sub(closestPlant!.pos).normalize();

    this.on("pointerdown", this.clickHandler);
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    if (!this.powerTower) {
      this.status = "unpowered";
    }

    if (this.oldStatus !== this.status) {
      if (this.status === "unpowered" || !this.powerTower) {
        this.graphics.current!.tint = Color.DarkGray;
      } else {
        this.graphics.current!.tint = Color.White;
      }
      this.oldStatus = this.status;
    }

    if (this.isPlacing) {
      this.graphics.opacity = 0.7;
      let mousePos = this.scene?.engine.input.pointers.primary.lastWorldPos;
      if (mousePos) {
        this.pos = mousePos;
      }
    }
  }

  set isPlacing(isPlacing: boolean) {
    this._isPlacing = isPlacing;
  }

  get isPlacing() {
    return this._isPlacing;
  }
}

/******************************
 Our Custom Graphic
*******************************/
class HealthBarGraphic extends Graphic {
  backgroundColor: Color = Color.Black;
  borderColor: Color = Color.White;
  safeColor: Color = Color.Green;
  warningColor: Color = Color.Yellow;
  criticalColor: Color = Color.Red;
  borderSize: number = 2;

  drawScale = 10; // This will help us inject extra pixels into the offline canvas to draw mo' pretty
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;

  // dirty flag to trigger a redraw so we don't redraw every frame
  dirtyFlag: boolean = true;
  percent: number = 1.0;
  newpercent: number = 1.0;
  changeRate: number = 0.01;

  constructor() {
    super({
      width: 36, //hard-coded for this example, matching the child actor dims, you can pass this in to the graphic IRL
      height: 6,
    });

    //setup offscreen Canvas
    this.cnv = document.createElement("canvas");
    this.cnv.width = this.width * this.drawScale;
    this.cnv.height = this.height * this.drawScale;
    this.ctx = this.cnv.getContext("2d");
  }

  updatePercent(percentfill: number) {
    this.newpercent = percentfill;
    if (this.newpercent === this.percent) return;
    this.dirtyFlag = true;
  }

  clone(): HealthBarGraphic {
    return new HealthBarGraphic();
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (this.dirtyFlag && this.ctx) {
      const ctx = this.ctx;
      const s = this.drawScale;

      // === Interpolation (smoothing transition) ===
      if (this.newpercent != this.percent) {
        if (this.newpercent > this.percent) {
          this.percent += this.changeRate;
        } else {
          this.percent -= this.changeRate;
        }
        // when close, set equal and clear dirty flag
        if (Math.abs(this.newpercent - this.percent) < this.changeRate) {
          this.percent = this.newpercent;
          this.dirtyFlag = false;
        }
      }

      // === Clear canvas and scale ===
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
      ctx.scale(s, s);

      // === Background ===
      ctx.fillStyle = this.backgroundColor.toString();
      ctx.fillRect(0, 0, this.width, this.height);

      // === Health fill ===
      const border = this.borderSize;
      const inset = border / 2; // or border if you prefer full padding
      const fillWidth = (this.width - border) * this.percent;
      const fillHeight = this.height - border; // stay inside border

      // === Changing colors ===
      if (this.percent > 0.5) {
        ctx.fillStyle = this.safeColor.toString();
      } else if (this.percent < 0.25) {
        ctx.fillStyle = this.criticalColor.toString();
      } else {
        ctx.fillStyle = this.warningColor.toString();
      }

      ctx.fillRect(
        inset, // x
        inset, // y
        fillWidth, // width
        fillHeight, // height
      );

      // === Border ===
      ctx.lineWidth = this.borderSize;
      ctx.strokeStyle = this.borderColor.toString();
      ctx.strokeRect(0, 0, this.width, this.height);
    }

    // === Draw canvas === (forcing canvas to update)
    this.cnv.setAttribute("forceUpload", "true");
    ex.save();
    ex.scale(1 / this.drawScale, 1 / this.drawScale);
    ex.drawImage(this.cnv, x * this.drawScale, y * this.drawScale);
    ex.restore();
  }
}

/******************************
 Our Child Actor
*******************************/
export class HealthBar extends Actor {
  currentHealth: number;
  maxHealth: number;

  constructor(pos: Vector, dims: Vector, maxHealth: number) {
    super({
      pos,
      width: dims.x,
      height: dims.y,
    });
    this.currentHealth = maxHealth; //<--- track the player's health
    this.maxHealth = maxHealth;
    this.graphics.use(new HealthBarGraphic());
  }

  takeDamage(damageAmount: number) {
    // console.log("taking tower damage", damageAmount);

    this.currentHealth -= damageAmount;
    let percent = this.currentHealth / this.maxHealth;
    (this.graphics.current as HealthBarGraphic).updatePercent(percent);
  }
}
