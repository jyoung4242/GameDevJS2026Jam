import { EventEmitter } from "excalibur";
import { Loot, LootCollectedEvent, LootCollectionEvents } from "../Actors/Loot";

export class InventoryObject {
  static scrapItems: Map<string, number> = new Map();

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
      if (InventoryObject.scrapItems.has(loot.name as string)) {
        //@ts-ignore
        InventoryObject.scrapItems.set(loot.name, InventoryObject.scrapItems.get(loot.name)! + 1);
        console.log(InventoryObject.scrapItems);
      }
    });
  }
}
