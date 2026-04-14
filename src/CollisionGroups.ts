import { CollisionGroup } from "excalibur";

export const towerColliderGroup = new CollisionGroup("tower", 0b001, 0b001);
export const enemyColliderGroup = new CollisionGroup("enemy", 0b010, 0b010);
export const weaponColliderGroup = new CollisionGroup("weapon", 0b100, 0b010);
export const lootColliderGroup = new CollisionGroup("loot", 0b1000, 0b0000);
