import { Component, Actor, Scene, Vector } from "excalibur";
import { GameField } from "../Actors/GameField";

export enum Rarity {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  Epic = "epic",
  Legendary = "legendary",
}

export interface LootEntry {
  /** Factory function returning a fresh LootItem actor instance */
  factory: () => Actor;
  /** Relative drop weight — higher = more frequent */
  weight: number;
  rarity: Rarity;
}

export interface LootConfig {
  entries: LootEntry[];
  /** Max pixel radius to scatter dropped items from owner position */
  scatterRadius?: number;
}

export class LootComponent extends Component {
  readonly type = "loot";

  private entries: LootEntry[];
  private scatterRadius: number;
  private totalWeight: number;

  constructor(config: LootConfig) {
    super();
    this.entries = config.entries;
    this.scatterRadius = config.scatterRadius ?? 24;
    this.totalWeight = this.entries.reduce((sum, e) => sum + e.weight, 0);
  }

  /** Weighted random pick — returns one entry or null */
  private roll(): LootEntry | null {
    if (this.entries.length === 0) return null;
    let r = Math.random() * this.totalWeight;
    for (const entry of this.entries) {
      r -= entry.weight;
      if (r <= 0) return entry;
    }
    return this.entries[this.entries.length - 1];
  }

  private scatterOffset(): Vector {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.scatterRadius;
    return new Vector(Math.cos(angle) * dist, Math.sin(angle) * dist);
  }

  /**
   * Roll once per entry independently (each has its own drop chance).
   * Call this from enemy's kill/death handler.
   */
  dropAll(gameField: GameField, ownerPos: Vector): void {
    for (const entry of this.entries) {
      const rolled = this.roll();
      if (rolled === entry) {
        const actor = entry.factory();
        actor.pos = ownerPos.add(this.scatterOffset());
        gameField.addChild(actor);
      }
    }
  }

  /**
   * Drop exactly one item (single weighted roll).
   * Good for enemies that always drop something.
   */
  dropOne(gameField: GameField, ownerPos: Vector): void {
    const entry = this.roll();
    if (!entry) return;
    const actor = entry.factory();
    actor.pos = ownerPos.add(this.scatterOffset());
    gameField.addChild(actor);
  }
}
