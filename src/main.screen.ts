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

    .container {
      position: absolute;
      visibility: hidden;
      // pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      font-size: 24px;
      transform-origin: 0 0;
      // transform: translate(0, 0) scale(calc(var(--ex-pixel-ratio)), calc(var(--ex-pixel-ratio)));
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
      gap: 20px;
      left: 20px;
      bottom: 20px;
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

  protected render(): unknown {
    const styles = {
      '--ex-pixel-ratio': `${this.pixelRatio}`,
      visibility: this.visible ? 'visible' : 'hidden',
      left: `${this.left}px`,
      top: `${this.top}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    };

    return html`
    <div class="container" style=${styleMap(styles)}>
      <div class="header">
        <div class="top-right">
            <h2>Wave: ${this.waveManager?.level}</h2>
            <h3>♥️${this.health}</h3>
        </div>
      </div>

      <div class="bottom-left">
        <button @click=${this.startNextWave}>Start Wave</button>
        <button>Shop</button>
        <button>Inventory</button>
        <button>Settings</button>
        <div class="stats">
          <div class="money">💰67</div>
          <div class="energy"><span style="color:yellow">🗲</span>101</div>
        </div>
        
      </div>

    </div>`
  }
}
