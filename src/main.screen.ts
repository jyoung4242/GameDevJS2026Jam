import { css, html, LitElement, PropertyDeclarations } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { EnemyWaveController } from "./Lib/enemyWaveController";
import { Resources } from "./resources";
import { TowerManager } from "./Lib/TowerManager";
import { InventoryObject } from "./Lib/InventoryObject";
import { repeat } from "lit-html/directives/repeat.js";
import { PowerPlantTower, STARTING_TOWER_CAPACITY } from "./Actors/towers";
import { Random } from "excalibur";

@customElement("main-screen")
export class MainScreen extends LitElement {
  static styles = css`
    :host {
      font-family: "PressStart2P", sans-serif;
      color: black;
    }

    * {
      box-sizing: border-box;
    }

    h2,
    h3 {
      margin: 0;
      text-align: right;
    }

    button {
      font-family: "PressStart2P", sans-serif;
      color: black;
      height: 32px;
      user-select: none;
    }

    .container {
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      font-size: 24px;
      transform-origin: 0 0;
      user-select: none;
    }

    .toggle-shop {
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      transition:
        opacity 0.5s ease-in-out,
        top 0.5s ease-in-out;
    }

    .toggle-inventory {
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      transition:
        opacity 0.5s ease-in-out,
        top 0.5s ease-in-out;
    }

    .toggle-tower-details {
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      transition:
        opacity 0.5s ease-in-out,
        top 0.5s ease-in-out;
    }

    .header {
      display: flex;
      width: 100%;
      justify-content: flex-end;
      padding: 20px;
      user-select: none;
    }

    .top-right {
      // justify-self: flex-end;
      // top: 0;
      // right: 0;
    }

    .bottom-left {
      position: absolute;
      display: flex;
      flex-direction: column;
      pointer-events: auto;
      gap: 20px;
      left: 20px;
      bottom: 20px;
    }

    .shop,
    .inventory,
    .tower-details {
      padding: 20px;
      z-index: 10;
      pointer-events: auto;
      position: absolute;
      top: 100%;
      width: 80%;
      height: 0;
      background-color: gray;

      h2 {
        text-align: left;
        margin-bottom: 16px;
      }

      .content {
        flex: 1 1 auto;
        display: flex;
        gap: 5px;
        padding: 20px;
        border: solid 1px black;
        border-radius: 16px;
        box-shadow:
          4px 7px 7px -7px #000 inset,
          0px -2px 28px 0px #000 inset;
      }
    }

    .shop {
      width: 100%;
      height: 80%;
    }

    .shop .shop-content {
      flex: 1 1 auto;
      display: flex;
    }

    .shop .options {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 20px;

      button {
        height: 64px;
      }

      li {
        font-size: 10px;
      }

      .reroll {
        background-color: greenyellow;
      }

      .done {
        background-color: red;
        color: white;
      }
    }

    .shop .actions {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }

    .shop .actions .offer {
      flex: 1 1 auto;
      display: flex;
      gap: 5px;
      padding: 20px;
      border: solid 1px black;
      border-radius: 16px;
      box-shadow:
        4px 7px 7px -7px #000 inset,
        0px -2px 28px 0px #000 inset;
    }

    .shop .part-offer {
      width: 128px;
      height: 128px;
    }

    .inventory {
      width: 100%;
      height: 80%;
      h2 {
      }
      .inventory-content {
        flex: 1 1 auto;
        min-height: 256px;
        display: flex;
        gap: 5px;
        padding: 20px;
        border: solid 1px black;
        border-radius: 16px;
        box-shadow:
          4px 7px 7px -7px #000 inset,
          0px -2px 28px 0px #000 inset;
      }

      .done {
        background-color: red;
        color: white;
      }
    }

    .stats {
      z-index: 11;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      width: 150px;
      height: 100px;
      background-color: black;

      .money,
      .energy {
        display: flex;
        width: 100%;
        justify-content: space-between;
      }

      .icon {
        // align-self: flex-start;
      }
      .value {
        // align-self: flex-end;
      }
    }
  `;
  static properties: PropertyDeclarations = { health: { type: Number } };

  @property()
  accessor health: number = 20;

  @property()
  accessor wave: number = 1;

  @property()
  accessor visible: boolean = false;

  @property()
  accessor rerollCost: number = 2;

  rerollScale = 3;

  left = 0;
  top = 0;
  width: number = 800;
  height: number = 600;
  pixelRatio: number = 1.0;
  waveManager!: EnemyWaveController;
  towerManager!: TowerManager;
  inventory!: InventoryObject;
  random!: Random;

  isShopVisible: boolean = false;
  isInventoryVisible: boolean = false;
  isTowerDetailsVisible: boolean = false;

  // override to disable shadow dom for --ex-pixel-ratio
  // override createRenderRoot() { return this; }

  public setRandom(random: Random) {
    this.random = random;
  }

  public setPos(x: number, y: number) {
    this.left = x;
    this.top = y;
    this.requestUpdate();
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.requestUpdate();
  }

  public setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.requestUpdate();
  }

  public setWaveManager(waveManager: EnemyWaveController) {
    this.waveManager = waveManager;
    this.requestUpdate();
  }

  public setTowerManager(towerManager: TowerManager) {
    this.towerManager = towerManager;
    this.requestUpdate();
  }

  public setInventory(gameInventory: InventoryObject) {
    this.inventory = gameInventory;
  }

  public startNextWave() {
    if (this.waveManager) {
      this.waveManager.startNewWave();
      this.generateOffer();
    }
    this.requestUpdate();
  }

  public showShop() {
    Resources.ShopOpen.play(0.25);
    this.isShopVisible = true;

    this.requestUpdate();
  }

  public hideShop() {
    Resources.ShopClose.play(0.25);
    this.isShopVisible = false;
    this.requestUpdate();
  }

  public showInventory() {
    this.isInventoryVisible = true;
    this.requestUpdate();
  }

  public hideInventory() {
    this.isInventoryVisible = false;
    this.requestUpdate();
  }

  public hideAll() {
    this.hideShop();
    this.hideInventory();
  }

  public getTotalPower() {
    if (!this.towerManager?.towers) return 0;
    if (this.towerManager?.towers?.length === 0) return 0;

    return this.towerManager.towers.reduce((acc, tower) => {
      if (tower instanceof PowerPlantTower) {
        return acc + STARTING_TOWER_CAPACITY;
      }
      return acc;
    }, 0);
  }

  public getUsedPower() {
    if (!this.towerManager?.towers) return 0;
    if (this.towerManager?.towers?.length === 0) return 0;

    return this.towerManager.towers.reduce((acc, tower) => {
      if (tower instanceof PowerPlantTower) {
        return acc;
      }
      return acc + 1;
    }, 0);
  }

  public sellScrap() {
    // TODO update bank
    InventoryObject.resetScrap();
    this.requestUpdate();
  }

  public possibleItems = ["item 1", "item 2", "item 3", "item 4", "item 5", "item 6"];
  public currentOffer: string[] = [];
  public generateOffer() {
    this.currentOffer = this.random.pickSet(this.possibleItems, 3);
  }

  public reroll() {
    Resources.ShopPurchase.play(0.4);
    this.rerollCost = this.rerollCost + this.rerollScale;
    this.generateOffer();
    this.requestUpdate();
  }

  protected render(): unknown {
    const styles = {
      "--ex-pixel-ratio": `${this.pixelRatio}`,
      visibility: this.visible ? "visible" : "hidden",
      left: `${this.left}px`,
      top: `${this.top}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    };

    const toggleShopStyles = {
      opacity: this.isShopVisible ? 1 : 0,
      "z-index": this.isShopVisible ? 10 : 5,
      top: this.isShopVisible ? "20%" : "100%",
      height: this.isShopVisible ? "80%" : "0%",
    };

    const toggleInventoryStyles = {
      opacity: this.isInventoryVisible ? 1 : 0,
      "z-index": this.isInventoryVisible ? 10 : 5,
      top: this.isInventoryVisible ? "20%" : "100%",
      height: this.isInventoryVisible ? "80%" : "0%",
    };

    const toggleTowerDetailsStyles = {
      opacity: this.isTowerDetailsVisible ? 1 : 0,
      "z-index": this.isTowerDetailsVisible ? 10 : 5,
      top: this.isTowerDetailsVisible ? "20%" : "100%",
      height: this.isTowerDetailsVisible ? "60%" : "0%",
    };

    return html` <div class="container" style=${styleMap(styles)}>
      <div class="header">
        <div class="top-right">
          <h2>Wave: ${this.waveManager?.level}</h2>
          <h3><span>♥️</span><span>${this.health}</span></h3>
        </div>
      </div>

      <div class="shop toggle-shop" style=${styleMap(toggleShopStyles)}>
        <h2>Shop</h2>

        <div class="shop-content">
          <div class="options">
            <button class="reroll" @click=${this.reroll}>Re-Roll $${this.rerollCost}</button>

            <button class="done" @click=${this.hideShop}>Done</button>
          </div>

          <div class="actions">
            <div class="offer">
              ${this.currentOffer.map(offer => {
                return html`<button class="part-offer">${offer}</button>`;
              })}
              <!-- <button class="part-offer">Firing Speed</button> -->
              <!-- <button class="part-offer">Damage</button> -->
              <!-- <button class="part-offer">Max Health</button> -->
            </div>

            <div class="sell">
              <!-- Maybe things can become more valuable? -->
              <button @click=${this.sellScrap}>Sell Scrap</button>

              <ul class="content">
                ${repeat(
                  InventoryObject.scrapItems,
                  e => e[0],
                  ([type, number]) => {
                    if (number) {
                      return html`<li>${type}:${number}</li>`;
                    }
                  },
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="inventory toggle-inventory" style=${styleMap(toggleInventoryStyles)}>
        <h2>Inventory</h2>

        <button class="done" @click=${this.hideInventory}>Done</button>

        <h3>Parts</h3>
        <div class="content">
          <ul>
            ${repeat(
              InventoryObject.scrapItems,
              e => e[0],
              ([type, number]) => {
                if (number) {
                  return html`<li>${type}:${number}</li>`;
                }
              },
            )}
          </ul>
        </div>
        <h3>Scrap</h3>
        <div class="content">
          <ul>
            ${repeat(
              InventoryObject.scrapItems,
              e => e[0],
              ([type, number]) => {
                if (number) {
                  return html`<li>${type}:${number}</li>`;
                }
              },
            )}
          </ul>
        </div>
      </div>

      <div class="tower-details toggle-tower-details" style=${styleMap(toggleTowerDetailsStyles)}>
        <h2>Tower Details</h2>
      </div>

      <div class="bottom-left">
        <button @click=${this.startNextWave}>Start Wave</button>
        <button @click=${this.showShop}>Shop</button>
        <button @click=${this.showInventory}>Inventory</button>
        <!-- <button>Settings</button> -->
        <div class="stats">
          <div class="money">
            <span class="icon">💰</span>
            <span class="value">${InventoryObject.money}</span>
          </div>
          <div class="energy">
            <span class="icon" style="color:yellow">🗲</span>
            <span class="value">${this.getUsedPower()}/${this.getTotalPower()}</span>
          </div>
        </div>
      </div>
    </div>`;
  }
}
