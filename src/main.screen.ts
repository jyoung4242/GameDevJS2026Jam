import { css, html, LitElement, PropertyDeclarations } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { EnemyWaveController } from "./Lib/enemyWaveController";
import { Resources } from "./resources";

@customElement('main-screen')
export class MainScreen extends LitElement {
  static styles = css`
    :host {
      font-family: "PressStart2P", sans-serif;
      color: black;
    }

    * {
      box-sizing: border-box;
    }

    h2, h3 {
      margin: 0;
      text-align: right;
    }
  
    button {
      font-family: "PressStart2P", sans-serif;
      color: black;
      height: 32px;
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
      // transform: translate(0, 0) scale(calc(var(--ex-pixel-ratio)), calc(var(--ex-pixel-ratio)));
    }

    .toggle-shop {
      // visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity .5s ease-in-out, top .5s ease-in-out; 
    }

    .toggle-inventory {
      visibility: hidden;
      opacity: 0;
      transition: opacity 1s ease-in-out; 
    }


    .toggle-tower-details {
      visibility: hidden;
      opacity: 0;
      transition: opacity 1s ease-in-out; 
    }

    .header {
      display: flex;
      width: 100%;
      justify-content: flex-end;
      padding: 20px;
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
  
    .shop, .inventory, .tower-details {
      padding: 20px;
      z-index: 10;
      pointer-events: auto;
      position: absolute;
      top: 100%;
      width: 80%;
      height: 60%;
      background-color: gray;


      h2 {
        text-align: left;
        margin-bottom: 32px;
      }
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
      box-shadow: 4px 7px 7px -7px #000 inset, 0px -2px 28px 0px #000 inset;
    }

    .shop .part-offer {
      width: 128px;
      height: 128px;
    }

    .stats {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      width: 150px;
      height: 100px;
      background-color: black;

      .money, .energy {
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


  left = 0;
  top = 0;
  width: number = 800;
  height: number = 600;
  pixelRatio: number = 1.0;
  waveManager!: EnemyWaveController;
  isShopVisible: boolean = false;
  isInventoryVisible: boolean = false;
  isTowerDetailsVisible: boolean = false;

  // override to disable shadow dom for --ex-pixel-ratio
  // override createRenderRoot() { return this; }

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

  public startNextWave() {
    if (this.waveManager) {
      this.waveManager.startNewWave();
    }
    this.requestUpdate();
  }

  public showShop() {
    Resources.ShopOpen.play(.25); 
    this.isShopVisible = true;

    this.requestUpdate();
  }

  public hideShop() {
    Resources.ShopClose.play(.25);
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

  protected render(): unknown {
    const styles = {
      '--ex-pixel-ratio': `${this.pixelRatio}`,
      visibility: this.visible ? 'visible' : 'hidden',
      left: `${this.left}px`,
      top: `${this.top}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    };

    const toggleShopStyles = {
      // visibility: this.isShopVisible ? 'visible' : 'hidden',
      opacity: this.isShopVisible ? 1 : 0,
      top: this.isShopVisible ? '20%' : '100%'
    }

    const toggleInventoryStyles = {
      visibility: this.isInventoryVisible ? 'visible' : 'hidden',
      opacity: this.isInventoryVisible ? 1 : 0,
    }


    const toggleTowerDetailsStyles = {
      visibility: this.isTowerDetailsVisible ? 'visible' : 'hidden',
      opacity: this.isTowerDetailsVisible ? 1 : 0,

    }

    return html`
    <div class="container" style=${styleMap(styles)}>
      <div class="header">
        <div class="top-right">
            <h2>Wave: ${this.waveManager?.level}</h2>
            <h3>♥️${this.health}</h3>
        </div>
      </div>

      <div class="shop toggle-shop" style=${styleMap(toggleShopStyles)} >
        <h2>Shop</h2>

        <div class="shop-content">
          <div class="options">
            <button class="reroll">Re-Roll $123</button>

            <button class="done" @click=${this.hideShop}>Done</button>
          </div>

          <div class="actions">
            <div class="offer">
              <button class="part-offer">Firing Speed</button>
              <button class="part-offer">Damage</button>
              <button class="part-offer">Max Health</button>
            </div>

            <div class="sell">
              <!-- Maybe things can become more valuable? -->
              <button >Sell Scrap</button>
            </div>
          </div>

        </div>


      </div>

      <div class="inventory toggle-inventory" style=${styleMap(toggleInventoryStyles)}>
        <h2>Inventory</h2>

      </div>

      <div class="tower-details toggle-tower-details" style=${styleMap(toggleTowerDetailsStyles)}>
        <h2>Tower Details</h2>

      </div>

      <div class="bottom-left">
        <button @click=${this.startNextWave}>Start Wave</button>
        <button @click=${this.showShop}>Shop</button>
        <button @click=${this.showInventory}>Inventory</button>
        <button>Settings</button>
        <div class="stats">
          <div class="money">
              <span class="icon">💰</span>
              <span class="value">67</span>
          </div>
          <div class="energy">
            <span class="icon" style="color:yellow">🗲</span>
            <span class="value">101</span>
          </div>
        </div>

      </div>

    </div>`
  }
}
