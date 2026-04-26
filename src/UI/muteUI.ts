import { ScreenElement, Color, Graphic, Vector, Engine, PointerEvent, EventEmitter, GameEvent } from "excalibur";
import { Resources } from "../resources";
import { MuteableEngine } from "../main";

type MuteEvents = {
  MuteEvent: MuteEvent;
};

export class MuteManager {
  static _muteState: boolean = false;
  static emitter: EventEmitter = new EventEmitter();

  static init() {
    MuteManager.emitter.on("MuteEvent", (muteState: boolean) => {
      console.log("muteevent", muteState);
      MuteManager._muteState = muteState;
      if (MuteManager._muteState) {
        MuteManager.mute();
      } else {
        MuteManager.unmute();
      }
    });
  }

  static mute() {
    Resources.sprocketSound.stop();
  }
  static unmute() {
    Resources.sprocketSound.play();
  }

  static get muteState(): boolean {
    return MuteManager.muteState;
  }
}

export class UIMute extends ScreenElement {
  mutedGraphic: Graphic;
  unmutedGraphic: Graphic;
  engine: MuteableEngine | null = null;

  constructor(pos: Vector) {
    super({
      pos,
      width: 24,
      height: 24,
      color: Color.Transparent,
      z: 10000,
    });
    this.mutedGraphic = Resources.mute.toSprite();
    this.unmutedGraphic = Resources.unmute.toSprite();
    this.graphics.use(this.unmutedGraphic);
  }

  onAdd(engine: Engine): void {
    this.engine = engine as MuteableEngine;

    this.on("pointerdown", this.clickHandler);
    let muteState = (engine as MuteableEngine).mute;
    //change graphics
    if (muteState) {
      this.graphics.use(this.mutedGraphic);
    } else {
      this.graphics.use(this.unmutedGraphic);
    }
  }

  onRemove(engine: Engine): void {
    this.off("pointerdown", this.clickHandler);
  }

  clickHandler = (evt: PointerEvent) => {
    let muteState = this.engine!.mute;
    let newmuteState = !muteState;
    //change graphics
    if (newmuteState) {
      this.graphics.use(this.mutedGraphic);
    } else {
      this.graphics.use(this.unmutedGraphic);
    }
    this.engine!.mute = newmuteState;
  };
}

export class MuteEvent extends GameEvent<MuteEvents> {
  constructor(muteState: boolean) {
    super();
  }
}
