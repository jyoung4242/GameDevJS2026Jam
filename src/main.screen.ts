import { css, html, LitElement, PropertyDeclarations } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { EnemyWaveController } from "./Lib/enemyWaveController";

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
      visibility: hidden;
      opacity: 0;
      transition: opacity 1s ease-in-out; 
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
      z-index: 10;
      position: absolute;
      top: 10%;
      width: 80%;
      height: 80%;
      background-color: gray;
    }

    .stats {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 10px;
      width: 150px;
      height: 100px;
      background-color: black;
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
    this.isShopVisible = true;
    this.requestUpdate();
  }

  public hideShop() {
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
      visibility: this.isShopVisible ? 'visible' : 'hidden',
      opacity: this.isShopVisible ? 1 : 0,
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
          <div class="money">💰67</div>
          <div class="energy"><span style="color:yellow">🗲</span>101</div>
        </div>

      </div>

    </div>`
  }
}
