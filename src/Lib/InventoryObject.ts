import { EventEmitter } from "excalibur";
import { LootCollectionEvents } from "../Actors/Loot";

export class InventoryObject {
  static _scrapItems: Map<string, number> = new Map();
  static _money: number = 0;

  static init(lootEventEmitter: EventEmitter<LootCollectionEvents>) {
    InventoryObject.scrapItems.set("Missle Chassis", 0);
    InventoryObject.scrapItems.set("Laser Optics", 0);
    InventoryObject.scrapItems.set("Drone Engine", 0);
    InventoryObject.scrapItems.set("Burst Shells", 0);
    InventoryObject.scrapItems.set("Power Core", 0);
    InventoryObject.scrapItems.set("Power Cell", 0);
    InventoryObject.scrapItems.set("Servos", 0);

    lootEventEmitter.on("LootCollected", loot => {
      //@ts-ignore
      if (InventoryObject._scrapItems.has(loot.name as string)) {
        //@ts-ignore
        InventoryObject._scrapItems.set(loot.name, InventoryObject.scrapItems.get(loot.name)! + 1);
      }
    });
  }

  static get scrapItems() {
    return InventoryObject._scrapItems;
  }

  static get money() {
    return InventoryObject._money;
  }

  static set money(newValue: number) {
    InventoryObject._money = newValue;
  }

  static resetScrap() {
    InventoryObject.scrapItems.set("Missle Chassis", 0);
    InventoryObject.scrapItems.set("Laser Optics", 0);
    InventoryObject.scrapItems.set("Drone Engine", 0);
    InventoryObject.scrapItems.set("Burst Shells", 0);
    InventoryObject.scrapItems.set("Power Core", 0);
    InventoryObject.scrapItems.set("Power Cell", 0);
    InventoryObject.scrapItems.set("Servos", 0);
  }
}
