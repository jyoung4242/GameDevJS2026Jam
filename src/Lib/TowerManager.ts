import { EventEmitter, GameEvent, Vector } from "excalibur";
import { GameField } from "../Actors/GameField";
import { OtherTower, PowerPlantTower, Tower } from "../Actors/towers";
import { EnemyWaveController } from "./enemyWaveController";

export type TowerEvents = {
  towerCreated: TowerCreatedEvent;
  towerDestroyed: TowerDestroyedEvent;
  towerDamaged: TowerDamagedEvent;
};

export class TowerManager {
  gf: GameField;
  ewc: EnemyWaveController | null = null;
  towers: Tower[] = [];

  towerEmitter: EventEmitter<TowerEvents> = new EventEmitter<TowerEvents>();
  constructor(GameField: GameField) {
    this.gf = GameField;
  }

  registerEWC(ewc: EnemyWaveController) {
    this.ewc = ewc;
  }

  getclosestTower() {
    return this.towers[0];
  }

  createTower(type: "power" | "other", pos: Vector): Tower {
    let tower: Tower;

    switch (type) {
      case "power":
        tower = new PowerPlantTower(pos, this);
        break;
      case "other":
        tower = new OtherTower(pos, this);
        break;
    }

    this.towers.push(tower);
    this.gf.spawnTower(tower);
    this.towerEmitter.emit("towerCreated", new TowerCreatedEvent(tower));

    return tower;
  }

  destroyTower(tower: Tower) {
    this.towers = this.towers.filter(t => t !== tower);
    this.towerEmitter.emit("towerDestroyed", new TowerDestroyedEvent(tower));
  }

  getTowers() {}
}

export class TowerCreatedEvent extends GameEvent<TowerEvents> {
  constructor(public tower: Tower) {
    super();
  }
}

export class TowerDestroyedEvent extends GameEvent<TowerEvents> {
  constructor(public tower: Tower) {
    super();
  }
}

export class TowerDamagedEvent extends GameEvent<TowerEvents> {
  constructor(public tower: Tower) {
    super();
  }
}
