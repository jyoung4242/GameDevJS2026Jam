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

export type PartOffer = {
  type: WeaponTypes;
  display: string;
  price: number;
  width: number;
  height: number;

};

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

    /* The floating ghost while dragging */
    .drag-ghost {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.75;
      cursor: grabbing;
      background: #4a90e2;
      color: white;
      border: 2px dashed #fff;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: none;
    }

    /* Parts placed on the grid */
    .placed-part {
      position: absolute;
      top: 0;
      left: 0;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 0.75rem;
      cursor: default;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
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
      width: 50%;
      opacity: 0;
      top: 0;


      ul,li {
        display: flex;
        margin: 0;
        list-style-type: none;
      }

      table {
        border: solid 1px;
        border-spacing: 0;

        td {
          position: relative;
          padding: 24px;
          border: solid 1px;
        }

        td.drop-ok {
          background: rgba(74, 226, 100, 0.25);
          outline: 1px solid #3db85a;
        }

        td.drop-blocked {
          background: rgba(226, 74, 74, 0.25);
          outline: 1px solid #c0392b;
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
  private _dragging: boolean;
  private _dragEl: HTMLElement;
  private _dragData: any;
  private _dragOffset: { x: number; y: number; };
  private _boundMouseMove: (e: MouseEvent, part: PartOffer) => void;
  private _boundMouseUp: (e: MouseEvent, part: PartOffer) => void;
  private _occupiedCells: Set<string>;
  private _lastHighlighted: any;

  constructor() {
    super();
    this._dragging = false;
    this._dragEl = null as any;
    this._dragOffset = { x: 0, y: 0 };
    this._boundMouseMove = this.partMouseMove.bind(this);
    this._boundMouseUp = this.partMouseUp.bind(this);
    this._occupiedCells = new Set(); // tracks "row,col" strings

  }
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
    this.hideAll();
    if (this.waveManager) {
      Resources.selectSound.play(.3);
      this.waveManager.startNewWave();
      this.generateOffer();
    }
    this.requestUpdate();
  }

  public showShop() {
    this.hideAll();
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
    this.hideAll();
    this.isInventoryVisible = true;
    this.requestUpdate();
  }

  public hideInventory() {
    Resources.selectSound.play(.3);
    this.isInventoryVisible = false;
    this.requestUpdate();
  }

  public showTowerDetails() {
    this.hideAll();

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
    { type: "burst", display: "Burst", price: 2, width: 2, height: 3 },
    { type: "missle", display: "Missle", price: 3, width: 1, height: 4 },
    { type: "beam", display: "Beam", price: 5, width: 4, height: 1 },
    { type: "drone", display: "Drone", price: 4, width: 3, height: 3 },
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

  partDragStart(e: MouseEvent, part: PartOffer) {
    const btn: HTMLButtonElement = e.currentTarget! as HTMLButtonElement;
    const rect = btn.getBoundingClientRect();

    // Clone the button to drag around
    const ghost: HTMLElement = btn.cloneNode(true) as HTMLElement;
    ghost.classList.add('drag-ghost');
    ghost.style.width = btn.style.width;
    ghost.style.height = btn.style.height;
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    document.body.appendChild(ghost);

    this._dragging = true;
    this._dragEl = ghost;
    this._dragData = part;
    this._dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    document.addEventListener('mousemove', this._boundMouseMove as any);
    document.addEventListener('mouseup', this._boundMouseUp as any);
    e.preventDefault();

  }

  partMouseMove(e: MouseEvent, part: PartOffer) {
    if (!this._dragEl) return;
    this._dragEl.style.left = (e.clientX - this._dragOffset.x) + 'px';
    this._dragEl.style.top = (e.clientY - this._dragOffset.y) + 'px';


    // Highlight drop target validity
    const el = this.shadowRoot!.elementFromPoint(e.clientX, e.clientY);
    const td = el?.closest('td');
    const table = td?.closest('table');

    // Clear previous highlight
    if (this._lastHighlighted) {
      this._lastHighlighted.forEach((c: any) => c.classList.remove('drop-ok', 'drop-blocked'));
      this._lastHighlighted = null;
    }

    if (!td || !table) return;

    const { width, height } = this._dragData;
    const rows = Array.from(table.querySelectorAll('tr'));
    let originRow = -1, originCol = -1;

    rows.forEach((tr, r) => {
      Array.from(tr.cells).forEach((cell, c) => {
        if (cell === td) { originRow = r; originCol = c; }
      });
    });

    if (originRow === -1) return;

    let blocked = false;
    const targets = [];

    for (let r = originRow; r < originRow + height; r++) {
      for (let c = originCol; c < originCol + width; c++) {
        const cell = rows[r]?.cells[c];
        if (!cell || this._occupiedCells.has(`${r},${c}`)) { blocked = true; break; }
        targets.push(cell);
      }
      if (blocked) break;
    }

    const cls = blocked ? 'drop-blocked' : 'drop-ok';
    targets.forEach(c => c.classList.add(cls));
    this._lastHighlighted = targets;
  }

  partMouseUp(e: MouseEvent, part: PartOffer) {
    if (this._lastHighlighted) {
      this._lastHighlighted.forEach((c: any) => c.classList.remove('drop-ok', 'drop-blocked'));
      this._lastHighlighted = null;
    }
    document.removeEventListener('mousemove', this._boundMouseMove as any);
    document.removeEventListener('mouseup', this._boundMouseUp as any);

    if (this._dragEl) {
      this._dragEl.remove();
      this._dragEl = null as any;
    }

    this._dragging = false;
    this._tryDropOnTable(e);
  }

  _tryDropOnTable(e: MouseEvent) {
    // Find which TD is under the cursor
    const el = this.shadowRoot!.elementFromPoint(e.clientX, e.clientY);
    const td = el?.closest('td');
    if (!td) return;

    const table = td.closest('table');
    if (!table) return;

    const { width, height, type } = this._dragData;
    const rows = Array.from(table.querySelectorAll('tr'));

    // Find origin cell position
    let originRow = -1, originCol = -1;
    rows.forEach((tr, r) => {
      Array.from(tr.cells).forEach((cell, c) => {
        if (cell === td) { originRow = r; originCol = c; }
      });
    });

    if (originRow === -1) return;

    // Check every cell the part would cover
    for (let r = originRow; r < originRow + height; r++) {
      for (let c = originCol; c < originCol + width; c++) {
        const key = `${r},${c}`;
        if (this._occupiedCells.has(key) || !rows[r]?.cells[c]) {
          return; // blocked — abort drop
        }
      }
    }

    // All clear — mark cells as occupied
    for (let r = originRow; r < originRow + height; r++) {
      for (let c = originCol; c < originCol + width; c++) {
        this._occupiedCells.add(`${r},${c}`);
      }
    }

    // Place the button
    const placed = document.createElement('button');
    placed.textContent = type;
    placed.className = 'placed-part';
    placed.style.width = (50 * width) + 'px';
    placed.style.height = (50 * height) + 'px';

    td.colSpan = width;
    td.rowSpan = height;
    td.appendChild(placed);

    this._coverCells(rows, originRow, originCol, width, height, td);
  }

  _coverCells(rows: HTMLTableRowElement[], originRow: number, originCol: number, colSpan: number, rowSpan: number, originTd: HTMLTableCellElement) {
    for (let r = originRow; r < originRow + rowSpan; r++) {
      for (let c = originCol; c < originCol + colSpan; c++) {
        if (r === originRow && c === originCol) continue;
        const cell = rows[r]?.cells[c];
        if (cell) cell.style.display = 'none';
      }
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
        <h3>Machinery</h3>
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
            </tr>

            <tr>
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
            </tr>

            <tr>
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

        <h3>Parts</h3>
        <div class="content">
          <ul>
            ${InventoryObject.partItems.map((part) => {
      const sizeStyles = {
        width: (50 * part.width) + 'px',
        height: (50 * part.height) + 'px'
      };
      if (part.price) {
        return html`<li>
                  <button 
                  style=${styleMap(sizeStyles)}
                  @mousedown=${(e: MouseEvent) => this.partDragStart(e, part)}
                >${part.type}</button>
                </li>`;
      }
    })}
          </ul>
        </div>

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
