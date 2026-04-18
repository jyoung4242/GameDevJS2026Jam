import { Actor, Canvas, Engine, ExcaliburGraphicsContext, Graphic, GraphicOptions, easeInOutSine, vec } from "excalibur";

export class HoldRingActor extends Actor {
  holdRing: HoldingRingGraphic;
  duration: number = 500;
  elapsed: number = 0;
  constructor() {
    super({ width: 200, height: 200, pos: vec(-100, -100), z: 100 });
    this.holdRing = new HoldingRingGraphic();
    this.graphics.use(this.holdRing);
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.elapsed += elapsed;
    const delta = Math.min(this.elapsed, this.duration);
    const progress = delta / this.duration;
    this.holdRing.holdProgress = progress; // 1200ms hold time
  }
}

export class HoldingRingGraphic extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  holdProgress: number = 0; // 0–1, set externally each frame

  constructor() {
    super();
    this.cnv = document.createElement("canvas");
    this.cnv.width = 200;
    this.cnv.height = 200;
    this.ctx = this.cnv.getContext("2d");
  }

  clone(): Graphic {
    return new HoldingRingGraphic();
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (!this.ctx) return;
    console.log("drawing");

    const ctx = this.ctx;
    const cx = 100,
      cy = 100;
    const outerR = 70,
      innerR = 50;
    const outerW = 8,
      innerW = 6;
    const start = -Math.PI / 2;
    const ep = this.easeInOut(Math.min(Math.max(this.holdProgress, 0), 1));
    const innerP = Math.max(0, (ep - 0.15) / 0.85);

    ctx.clearRect(0, 0, 200, 200);

    // outer track
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(120,120,120,0.2)";
    ctx.lineWidth = outerW;
    ctx.lineCap = "butt";
    ctx.stroke();

    // outer fill
    if (ep > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, start, start + Math.PI * 2 * ep);
      ctx.strokeStyle = "#7F77DD";
      ctx.lineWidth = outerW;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // inner track
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(120,120,120,0.2)";
    ctx.lineWidth = innerW;
    ctx.lineCap = "butt";
    ctx.stroke();

    // inner fill (delayed — starts after outer is 15% full)
    if (innerP > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, start, start + Math.PI * 2 * innerP);
      ctx.strokeStyle = "#1D9E75";
      ctx.lineWidth = innerW;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    // === Draw canvas === (forcing canvas to update)
    this.cnv.setAttribute("forceUpload", "true");
    // blit offscreen canvas into Excalibur's context
    ex.drawImage(this.cnv, x, y);
  }
}
