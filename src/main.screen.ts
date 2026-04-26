import { css, html, LitElement, PropertyDeclarations } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { EnemyWaveController, WeaponTypes } from "./Lib/enemyWaveController";
import { Resources } from "./resources";
import { TowerManager } from "./Lib/TowerManager";
import { InventoryObject } from "./Lib/InventoryObject";
import { repeat } from "lit-html/directives/repeat.js";
import { PowerPlantTower, STARTING_TOWER_CAPACITY } from "./Actors/towers";
import { Random } from "excalibur";

export type PartOffer = { type: WeaponTypes; display: string; price: number };

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
        left 0.5s ease-in-out;
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
        margin: 0;
        border: solid 1px black;
        border-radius: 16px;
        box-shadow:
          4px 7px 7px -7px #000 inset,
          0px -2px 28px 0px #000 inset;
      }
    }

    .tower-details {
      left: 100%;
      height: 100%;
      opacity: 0;
      top: 0;

      table {
        border: solid 1px;
        border-spacing: 0;

        td {
          padding: 24px;
          border: solid 1px;
        }
        td:hover {
          background-color: white;
        }
      }

      .done {
        background-color: red;
        color: white;
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

      .reroll:disabled {
        background-color: rgba(239, 239, 239, 0.3);
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

    .offer {
      width: 600px;
      height: 170px;
    }

    .sell button {
      margin: 5px;
    }

    .sell .content {
      width: 600px;
      height: 170px;
    }

    .inventory {
      width: 100%;
      height: 80%;
      h2 {
      }
      ul,
      li {
        display: flex;
        margin: 0;
        list-style-type: none;

        button {
          height: 128px;
          width: 128px;
        }
      }

      .content {
        width: 600px;
        height: 170px;
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
  private _lastHovered: EventTarget | null = null;

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

  private _handleHover = (e: Event) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (btn && btn !== this._lastHovered) {
      this._lastHovered = btn;
      Resources.cursorSound.play(.3);
    }
  };

  private _handleLeave = (e: Event) => {
    if ((e.target as HTMLElement).closest("button")) {
      this._lastHovered = null;
    }
  };

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
      Resources.selectSound.play(.3);
      this.waveManager.startNewWave();
      this.generateOffer();
    }
    this.requestUpdate();
  }

  public showShop() {
    Resources.ShopOpen.play(0.2);
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
    Resources.selectSound.play(.3);
    this.isInventoryVisible = false;
    this.requestUpdate();
  }

  public showTowerDetails() {
    this.isTowerDetailsVisible = true;
    this.requestUpdate();
  }

  public hideTowerDetails() {
    Resources.selectSound.play(.3);
    this.isTowerDetailsVisible = false;
    this.requestUpdate();
  }

  public hideAll() {
    this.hideShop();
    this.hideInventory();
    this.hideTowerDetails();
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

  public buyPart(part: PartOffer) {
    let currentMoney = InventoryObject.money;
    if (currentMoney >= part.price) {
      Resources.ShopPurchase.play(0.3);

      const index = this.currentOffer.indexOf(part);
      if (index > -1) {
        this.currentOffer.splice(index, 1);
      }
      InventoryObject.money -= part.price;
      InventoryObject.partItems.push(part);

      this.requestUpdate();
    } else {
      Resources.ShopClose.play(0.3); // TODO add nuh uh
    }
  }

  public sellScrap() {
    for (let [type, count] of InventoryObject.scrapItems.entries()) {
      // TODO better bank update

      InventoryObject.money += this.random.d4() * count;
    }

    InventoryObject.resetScrap();
    this.requestUpdate();
  }

  public possibleItems: PartOffer[] = [
    { type: "burst", display: "Burst", price: 2 },
    { type: "missle", display: "Missle", price: 3 },
    { type: "beam", display: "Beam", price: 5 },
    { type: "drone", display: "Drone", price: 4 },
  ];
  public currentOffer: PartOffer[] = [];
  public generateOffer() {
    this.currentOffer = this.random.pickSet(this.possibleItems, 2);
  }

  public rerollAvailable(): boolean {
    return InventoryObject.money >= this.rerollCost;
  }

  public reroll() {
    let currentMoney = InventoryObject.money;
    if (this.rerollAvailable()) {
      Resources.ShopPurchase.play(0.3);

      InventoryObject.money = currentMoney - this.rerollCost;

      this.rerollCost = this.rerollCost + this.rerollScale;
      this.generateOffer();
      this.requestUpdate();
    } else {
      Resources.ShopClose.play(0.3); // TODO add nuh uh sound
    }
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
      left: this.isTowerDetailsVisible ? "50%" : "100%",
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
            <button
              class="reroll"
              ?disabled=${InventoryObject.money < this.rerollCost}
              @click=${this.reroll}
              @mouseover=${this._handleHover}
              @mouseleave=${this._handleLeave}
            >
              > Re-Roll $${this.rerollCost}
            </button>

            <button class="done" @click=${this.hideShop} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>
              >Done
            </button>
          </div>

          <div class="actions">
            <div class="offer">
              ${this.currentOffer.map(offer => {
                return html`<button
                  class="part-offer"
                  .value=${offer.price}
                  ?disabled=${InventoryObject.money < offer.price}
                  @click=${() => this.buyPart(offer)}
                  @mouseover=${this._handleHover}
                  @mouseleave=${this._handleLeave}
                >
                  >
                  <div>${offer.display}</div>
                  <div>$${offer.price}</div>
                </button>`;
              })}
              <!-- <button class="part-offer">Firing Speed</button> -->
              <!-- <button class="part-offer">Damage</button> -->
              <!-- <button class="part-offer">Max Health</button> -->
            </div>

            <div class="sell">
              <!-- Maybe things can become more valuable? -->
              <button @click=${this.sellScrap} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>>Sell Scrap</button>

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

        <button class="done" @click=${this.hideInventory} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>
          >Done
        </button>

        <h3>Parts</h3>
        <div class="content">
          <ul>
            ${InventoryObject.partItems.map(({ type, price }) => {
              if (price) {
                return html`<li><button>${type}</button></li>`;
              }
            })}
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

        <button class="done" @click=${this.hideTowerDetails} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>
          >Done
        </button>
        <div>Machinery</div>
        <table>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bottom-left">
        <button @click=${this.startNextWave} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>Start Wave</button>
        <button @click=${this.showShop} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>Shop</button>
        <button @click=${this.showInventory} @mouseover=${this._handleHover} @mouseleave=${this._handleLeave}>Inventory</button>
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
