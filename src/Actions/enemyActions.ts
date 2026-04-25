import {
  Action,
  Color,
  Entity,
  GraphicsComponent,
  Material,
  MotionComponent,
  nextActionId,
  Scene,
  Shader,
  TransformComponent,
  vec,
  Vector,
} from "excalibur";
import { Tower } from "../Actors/towers";
import { Enemy, RangedEnemy } from "../Actors/enemies";
import { Resources } from "../resources";

export class MeleeAttackAction implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;
  owner: Enemy;
  tower: Tower | null = null;
  cooldownTimer: number = 0;
  flashColor: Color = Color.White;
  resetCooldown: number = 0;
  private _stopped: boolean = false;

  private _graphics: GraphicsComponent;
  private _duration: number;
  private _material: Material | undefined;
  private _total: number = 0;
  private _currentDuration: number = 0;
  constructor(owner: Enemy, cooldown: number) {
    this.owner = owner;
    this.tower = owner.targetTower;
    this.cooldownTimer = cooldown;
    this.resetCooldown = cooldown;
    this._graphics = owner.get(GraphicsComponent);
    this._duration = cooldown;
    this._material = owner.scene?.engine.graphicsContext.createMaterial({
      name: "flash-material",
      color: Color.White,
      fragmentSource: `#version 300 es
    
        precision mediump float;
        uniform float u_blend;
        uniform sampler2D u_graphic;
        uniform vec4 u_color;
    
        in vec2 v_uv; 
        out vec4 color;
    
        void main() { 
            vec4 textureColor = texture(u_graphic, v_uv); 
            color = mix(textureColor, u_color, u_blend * textureColor.a);
            color.rgb = color.rgb * color.a;
        }`,
    }) as Material;
    this._total = cooldown;
  }

  isComplete(entity: any): boolean {
    return this._stopped || this._currentDuration <= 0;
  }

  reset(): void {
    console.log("resetting");

    this.isStarted = false;
    this.isRunning = false;
    this.cooldownTimer = this.resetCooldown;
    this._material?.update((shader: Shader) => {
      shader.trySetUniformFloat("u_blend", 0 / this._total);
    });
  }

  stop(): void {
    this.isRunning = false;
    this._stopped = true;
    this.isStarted = false;
    this.cooldownTimer = this.resetCooldown;
    this._material?.update((shader: Shader) => {
      shader.trySetUniformFloat("u_blend", 0 / this._total);
    });
  }

  update(elapsed: number): void {
    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
      this.owner.vel = Vector.Zero;
      // flash Player
      console.log("here in melee action", this.owner.targetTower);

      if (!this.owner.targetTower) return;
      this.owner.targetTower!.takeDamage(this.owner.strength);
      console.log("playing sound");

      this._total = this._duration;
      this._currentDuration = this._duration;
      this._graphics.material = this._material as Material;
      this.cooldownTimer = this.resetCooldown;
    }

    if (!this._graphics) {
      return;
    }

    this._currentDuration -= elapsed;

    if (this._graphics) {
      this._material?.update((shader: Shader) => {
        shader.trySetUniformFloat("u_blend", this._currentDuration / this._total);
      });
    }

    if (this.isComplete(this.owner)) {
      (this.owner as Enemy).graphics.material = null;
      this.stop();
    }
  }
}

export class RangedAttackAction implements Action {
  id: number = nextActionId();
  isStarted: boolean = false;
  isRunning: boolean = false;
  owner: Enemy;
  tower: Tower | null = null;
  cooldownTimer: number = 0;
  flashColor: Color = Color.White;
  private _stopped: boolean = false;

  private _graphics: GraphicsComponent;
  private _duration: number;
  private _material: Material | undefined;
  private _total: number = 0;
  private _currentDuration: number = 0;
  constructor(owner: Enemy, cooldown: number) {
    this.owner = owner;
    this.tower = owner.targetTower;
    this.cooldownTimer = cooldown;
    this._graphics = owner.get(GraphicsComponent);
    this._duration = cooldown;
    this._material = owner.scene?.engine.graphicsContext.createMaterial({
      name: "flash-material",
      color: Color.White,
      fragmentSource: `#version 300 es
    
        precision mediump float;
        uniform float u_blend;
        uniform sampler2D u_graphic;
        uniform vec4 u_color;
    
        in vec2 v_uv; 
        out vec4 color;
    
        void main() { 
            vec4 textureColor = texture(u_graphic, v_uv); 
            color = mix(textureColor, u_color, u_blend * textureColor.a);
            color.rgb = color.rgb * color.a;
        }`,
    }) as Material;
    this._total = cooldown;
  }

  isComplete(entity: any): boolean {
    return this._stopped || this._currentDuration <= 0;
  }

  reset(): void {
    this.isStarted = false;
    this.isRunning = false;
    this.cooldownTimer = 0;
    this._stopped = false;
    (this.owner as Enemy).graphics.material = null;
  }

  stop(): void {
    this.isRunning = false;
    this._stopped = true;
    (this.owner as Enemy).graphics.material = null;
  }

  update(elapsed: number): void {
    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
      this.owner.vel = Vector.Zero;
      (this.owner as RangedEnemy).fireWeapon(this.owner.targetTower!);
      this._total = this._duration;
      this._currentDuration = this._duration;
      this._graphics.material = this._material as Material;
    }

    if (!this._graphics) {
      return;
    }

    this._currentDuration -= elapsed;

    if (this._graphics) {
      this._material?.update((shader: Shader) => {
        shader.trySetUniformFloat("u_blend", this._currentDuration / this._total);
      });
    }

    if (this.isComplete(this.owner)) {
      (this.owner as Enemy).graphics.material = null;
      this.stop();
    }
  }
}

export class MoveCloserToTower implements Action {
  id = nextActionId();
  private _tx: TransformComponent;
  private _motion: MotionComponent;
  public x!: number;
  public y!: number;
  private _owner: Enemy;
  private _start!: Vector;
  private _end: Vector | null = null;
  private _dir!: Vector;
  private _speed: number;
  private _distance!: number;
  private _started = false;
  private _stopped = false;
  constructor(owner: Enemy, speed: number) {
    this._tx = owner.get(TransformComponent);
    this._motion = owner.get(MotionComponent);
    // this._end = new Vector(destX, destY);
    this._speed = speed;
    this._owner = owner;
  }

  public update(elapsed: number): void {
    let owner = this._owner;
    let nodepath = this._owner.nodePath;
    // let bt = this._owner.bt;
    // console.log("in move closer", owner, nodepath);

    if (!this._started) {
      this._started = true;
      if (!this._owner.nodePath || this._owner.nodePath.length == 0) {
        // console.log("resetting bt", bt);
        this.reset();
        // this._owner.bt?.reset();
        return;
      }
      this._end = this._owner.nodePath[0].pos;
      this._owner.nodePath.shift();
      this._start = new Vector(this._tx.pos.x, this._tx.pos.y);
      this._distance = this._start.distance(this._end);
      this._dir = this._end.sub(this._start).normalize();
    }
    const m = this._dir.scale(this._speed);
    this._motion.vel = vec(m.x, m.y);

    if (this.isComplete(this._owner) && this._end) {
      this._tx.pos = vec(this._end.x, this._end.y);
      this._motion.vel = vec(0, 0);
    }
  }

  public isComplete(entity: Entity): boolean {
    const tx = entity.get(TransformComponent);
    return this._stopped || new Vector(tx.pos.x, tx.pos.y).distance(this._start) >= this._distance;
  }

  public stop(): void {
    this._motion.vel = vec(0, 0);
    this._stopped = true;
  }

  public reset(): void {
    this._started = false;
    this._stopped = false;
  }
}

export class FindClosestTower implements Action {
  id: number = nextActionId();

  isStarted: boolean = false;
  isRunning: boolean = false;

  scene: Scene;
  owner: Enemy;

  constructor(scene: Scene, owner: Enemy) {
    this.scene = scene;
    this.owner = owner;
  }

  isComplete(entity: any): boolean {
    let completeCheck = this.owner.targetTower != null && this.owner.nodePath.length > 0;
    return completeCheck;
  }

  reset(): void {
    this.isStarted = false;
    this.isRunning = false;
  }

  stop(): void {
    this.isRunning = false;
  }

  update(elapsed: number): void {
    // console.log("in find closest tower");

    if (!this.isStarted) {
      this.isStarted = true;
      this.isRunning = true;
      let towers: Tower[] | undefined = this.scene.entities.filter(e => e instanceof Tower);
      // console.log("towers", towers);

      if (!towers) return;
      // find closest tower
      let closestTower = null;
      let closestDistance = Infinity;
      for (const tower of towers) {
        let distance = tower.pos.distance(this.owner.pos);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTower = tower;
        }
      }

      if (!closestTower == null) {
        // console.log("find closest tower", towers, closestTower, closestDistance);
        debugger;
        // this.owner.bt?.reset();
        return;
      }

      this.owner.targetTower = closestTower;

      if (!this.owner.targetTower) return;
      let targtNode = this.owner.getGraphNode(this.owner.targetTower!.pos);
      let currentNode = this.owner.getGraphNode(this.owner.pos);
      if (!currentNode || !targtNode) return;
      let astar = this.owner.navmap.aStar(currentNode, targtNode);

      this.owner.nodePath = astar.path!;
    }

    if (this.isComplete(this.owner)) this.stop();
  }
}
