import { Action, Actor, Color, Engine, Entity, ExcaliburGraphicsContext, GraphicsComponent, nextActionId, Vector } from "excalibur";

export class Glint implements Action {
  id: number = nextActionId();
  private _isStarted: boolean = false;
  private _isStopped: boolean = false;
  private _elapsedTime: number = 0;
  private _graphics: GraphicsComponent | null = null;
  private _phaseATime: number = 0;
  private _phaseBTime: number = 0;
  private _phaseCTime: number = 0;
  private _phaseDTime: number = 0;
  private _currentPhase: "A" | "B" | "C" | "D" = "A";
  private _drawColor: Color = new Color(0, 0, 0, 0);

  constructor(
    public owner: Actor,
    public engine: Engine,
    public glintColor: Color,
    public position: Vector,
    public innerRadius: number,
    public outerRadius: number,
    public duration: number,
    public opacity: number,
  ) {
    this._graphics = this.owner.get(GraphicsComponent);
    this._drawColor = Color.fromRGB(this.glintColor.r, this.glintColor.g, this.glintColor.b, this.opacity);
  }

  stop(): void {
    this._isStopped = true;
    if (this._graphics) this._graphics.onPostDraw = () => {};
  }

  reset(): void {
    this._isStopped = false;
    this._isStarted = false;
    this._elapsedTime = 0;
    this._currentPhase = "A";
  }

  isComplete(_entity: Entity): boolean {
    return this._isStopped;
  }

  update = (delta: number) => {
    if (!this._isStarted) {
      this._isStarted = true;

      //setting up initial phase on startup
      if (this._graphics) {
        this._graphics.onPostDraw = (context: ExcaliburGraphicsContext) => {
          let radius = lerp(this.innerRadius, this.outerRadius, this._elapsedTime / this.duration);
          context.drawCircle(this.position, radius, this._drawColor);
        };
      }
      this._currentPhase = "A";
      this._phaseATime = this.duration / 5;
      this._phaseBTime = (this.duration / 5) * 2;
      this._phaseCTime = (this.duration / 5) * 3;
      this._phaseDTime = (this.duration / 5) * 4;
    }

    this._elapsedTime += delta;

    if (this._elapsedTime <= this._phaseATime) {
      if (this._currentPhase == "A" || !this._graphics) return;
      return;
    } else if (this._elapsedTime <= this._phaseBTime) {
      if (this._currentPhase == "B" || !this._graphics) return;
      this._currentPhase = "B";

      this._graphics.onPostDraw = (context: ExcaliburGraphicsContext) => {
        context.drawCircle(this.position, this.innerRadius, this._drawColor);
        //grow the 4 lines radiating out of position
        let lineLength = lerp(this.innerRadius, this.outerRadius, (this._elapsedTime - this._phaseATime) / (this.duration / 5));
        context.drawLine(
          this.position,
          new Vector(this.position.x + lineLength, this.position.y),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x - lineLength, this.position.y),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x, this.position.y + lineLength),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x, this.position.y - lineLength),
          this._drawColor,
          this.innerRadius / 2,
        );
      };
    } else if (this._elapsedTime <= this._phaseCTime) {
      if (this._currentPhase == "C" || !this._graphics) return;
      this._graphics.onPostDraw = (context: ExcaliburGraphicsContext) => {
        context.drawCircle(this.position, this.innerRadius, this._drawColor);
        let lineLength = lerp(this.innerRadius, this.outerRadius, (this._elapsedTime - this._phaseBTime) / (this.duration / 5));
        context.drawLine(
          this.position,
          new Vector(this.position.x + lineLength, this.position.y),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x - lineLength, this.position.y),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x, this.position.y + lineLength),
          this._drawColor,
          this.innerRadius / 2,
        );
        context.drawLine(
          this.position,
          new Vector(this.position.x, this.position.y - lineLength),
          this._drawColor,
          this.innerRadius / 2,
        );
      };
      this._currentPhase = "C";
    } else if (this._elapsedTime <= this._phaseDTime) {
      if (this._currentPhase == "D" || !this._graphics) return;
      this._graphics.onPostDraw = (context: ExcaliburGraphicsContext) => {
        //start shrinking the circle to zero from innercircle
        let radius = lerp(this.innerRadius, 0, (this._elapsedTime - this._phaseCTime) / (this.duration / 5));
        context.drawCircle(this.position, radius, this._drawColor);
      };
      this._currentPhase = "D";
    } else if (this._elapsedTime > this._phaseDTime) {
      this._isStopped = true;
      this.stop();
    }
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
