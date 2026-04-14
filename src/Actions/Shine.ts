import {
  Action,
  Actor,
  Color,
  Engine,
  ExcaliburGraphicsContext,
  ExcaliburGraphicsContext2DCanvas,
  GraphicsComponent,
  nextActionId,
  Vector,
} from "excalibur";

export class Shine implements Action {
  id: number = nextActionId();
  _position: Vector = new Vector(0, 0);
  _journeyLength: number = 0;
  _speed: number = 0;
  _elapsedTime: number = 0;
  _isStarted: boolean = false;
  _stopped: boolean = false;
  _drawingContext: ExcaliburGraphicsContext;
  _graphics: GraphicsComponent;
  public constructor(
    public owner: Actor,
    public engine: Engine,
    public color: Color,
    public duration: number,
    public lineWidth: number,
    public opacity: number,
  ) {
    this._drawingContext = this.engine.graphicsContext;
    this._graphics = this.owner.get(GraphicsComponent);
  }

  isComplete(): boolean {
    return this._stopped;
  }

  reset(): void {
    this._isStarted = false;
    this._stopped = false;
  }

  stop(): void {
    this._graphics.onPostDraw = () => {};
    this._stopped = true;
  }

  update(delta: number): void {
    if (!this._isStarted) {
      this._isStarted = true;
      this._elapsedTime = 0;
      this._journeyLength = this.owner.width + this.owner.height;
      this._speed = this._journeyLength / this.duration;
      let startposition = new Vector(0, 0);
      let endposition = new Vector(0, 0);
      let halfwayTime = this.duration / 2;

      if (this._graphics) {
        this._graphics.onPostDraw = (context: ExcaliburGraphicsContext) => {
          if (this._elapsedTime < this.duration / 2) {
            //first half
            startposition = new Vector(0, this._elapsedTime * this._speed);
            endposition = new Vector(this._elapsedTime * this._speed, 0);
          } else {
            //second half
            startposition = new Vector((this._elapsedTime - halfwayTime) * this._speed, this.owner.height);
            endposition = new Vector(this.owner.width, (this._elapsedTime - halfwayTime) * this._speed);
          }
          let color = Color.fromRGB(this.color.r, this.color.g, this.color.b, this.opacity);
          context.drawLine(startposition, endposition, color, this.lineWidth);
        };
      }
    }

    this._elapsedTime += delta;
    if (this._elapsedTime >= this.duration) this.stop();
  }
}
