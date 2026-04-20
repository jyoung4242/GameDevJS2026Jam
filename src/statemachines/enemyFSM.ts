import { ActionCompleteEvent, Color } from "excalibur";
import { FindClosestTower, MoveCloserToTower } from "../Actions/enemyActions";
import { Enemy, FastEnemy, RangedEnemy, TankEnemy } from "../Actors/enemies";
import { ExState } from "../Lib/exFSM";

export class IdleState extends ExState {
  constructor(public owner: Enemy) {
    super("Idle");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering Idle");
  }

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("exiting Idle");
  }

  update(..._params: any): void | Promise<void> {
    // console.log("in idle", this.owner.targetTower, this.owner.nodePath.length);

    if (this.owner.targetTower == null && this.owner.nodePath.length == 0) this.owner.fsm.set("FindingTower");
  }
}

export class FindingTargetTower extends ExState {
  constructor(public owner: Enemy) {
    super("FindingTower");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering FindingTower");
    this.owner.on("actioncomplete", this.actionHandler);
    this.owner.actions.runAction(new FindClosestTower(this.owner.scene!, this.owner));
  }

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.owner.off("actioncomplete", this.actionHandler);
    // console.log("exiting FindingTower");
  }

  actionHandler = (evt: ActionCompleteEvent) => {
    // if correct action
    // move to next state
    if (evt.action instanceof FindClosestTower) {
      this.owner.fsm.set("ApproachingTower");
    }
  };

  update(..._params: any): void | Promise<void> {}
}

export class FindingTargetSegment extends ExState {
  constructor(public owner: Enemy) {
    super("FindingPath");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering FindingTower");
    this.owner.on("actioncomplete", this.actionHandler);
    this.owner.actions.runAction(new FindClosestTower(this.owner.scene!, this.owner));
  }

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.owner.off("actioncomplete", this.actionHandler);
    // console.log("exiting FindingTower");
  }

  actionHandler = (evt: ActionCompleteEvent) => {
    // if correct action
    // move to next state
    if (evt.action instanceof FindClosestTower) {
      this.owner.fsm.set("ApproachingTower");
    }
  };

  update(..._params: any): void | Promise<void> {}
}

export class ApproachingTower extends ExState {
  constructor(public owner: Enemy) {
    super("ApproachingTower");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering ApproachingTower");
    this.owner.on("actioncomplete", this.actionHandler);
    this.owner.actions.runAction(new MoveCloserToTower(this.owner, this.owner.speed));
  }

  actionHandler = (evt: ActionCompleteEvent) => {
    if (evt.action instanceof MoveCloserToTower) {
      if (this.owner.targetRangeCheck()) {
        this.owner.fsm.set("AttackingTower");
      } else {
        this.owner.fsm.set("ApproachingTower");
      }
    }
  };

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.owner.off("actioncomplete", this.actionHandler);
    // console.log("exiting ApproachingTower");
  }

  update(..._params: any): void | Promise<void> {}
}

export class ApproachingSegment extends ExState {
  constructor(public owner: Enemy) {
    super("ApproachingSegment");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering ApproachingTower");
    this.owner.on("actioncomplete", this.actionHandler);
    this.owner.actions.runAction(new MoveCloserToTower(this.owner, this.owner.speed));
  }

  actionHandler = (evt: ActionCompleteEvent) => {
    if (evt.action instanceof MoveCloserToTower) {
      if (this.owner.targetRangeCheck()) {
        this.owner.fsm.set("AttackingSegment");
      } else {
        this.owner.fsm.set("ApproachingSegment");
      }
    }
  };

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.owner.off("actioncomplete", this.actionHandler);
    // console.log("exiting ApproachingTower");
  }

  update(..._params: any): void | Promise<void> {}
}

export class AttackingTower extends ExState {
  currentTik: number = 0;
  constructor(
    public owner: Enemy,
    public cooldown: number,
  ) {
    super("AttackingTower");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    // console.log("entering AttackingTower");
    this.currentTik = 0;

    if (this.owner instanceof TankEnemy) {
      this.owner.targetTower?.takeDamage(this.owner.strength);
    } else if (this.owner instanceof RangedEnemy) {
      (this.owner as RangedEnemy).fireWeapon(this.owner.targetTower!);
    }

    this.owner.actions.flash(Color.White, this.cooldown * 16);
  }

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.currentTik = 0;
    // console.log("exiting AttackingTower");
  }

  towerCheck(): boolean {
    if (this.owner.scene?.entities.includes(this.owner.targetTower!)) {
      return true;
    }
    return false;
  }

  update(..._params: any): void | Promise<void> {
    this.currentTik++;
    if (this.currentTik >= this.cooldown) {
      // if tower still alive, redo state
      if (this.towerCheck()) {
        this.owner.fsm.set("AttackingTower");
      } else {
        // find next tower
        this.owner.fsm.set("FindingTower");
      }
    }
  }
}

export class AttackingSegment extends ExState {
  currentTik: number = 0;
  constructor(
    public owner: Enemy,
    public cooldown: number,
  ) {
    super("Attack Segment");
  }

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    this.currentTik = 0;

    if (this.owner instanceof FastEnemy) {
      this.owner.targetSegment?.takeDamage(this.owner.strength);
    }
    this.owner.actions.flash(Color.White, this.cooldown * 16);
  }

  exit(_next: ExState | null, ..._params: any): void | Promise<void> {
    this.currentTik = 0;
  }

  towerCheck(): boolean {
    if (this.owner.scene?.entities.includes(this.owner.targetTower!)) {
      return true;
    }
    return false;
  }

  update(..._params: any): void | Promise<void> {
    this.currentTik++;
    if (this.currentTik >= this.cooldown) {
      // if tower still alive, redo state
      if (this.towerCheck()) {
        this.owner.fsm.set("AttackingSegment");
      } else {
        // find next tower
        this.owner.fsm.set("FindingSegment");
      }
    }
  }
}
