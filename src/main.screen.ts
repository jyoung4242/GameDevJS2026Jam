import { css, html, LitElement, PropertyDeclarations } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('main-screen')
export class MainScreen extends LitElement {
  static styles = css`
    :host {
      font-family: "PressStart2P", sans-serif;
      color: black;
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
      // transform: translate(-50%, 200%) scale(calc(var(--ex-pixel-ratio)), calc(var(--ex-pixel-ratio)));
    }

    .top-right {
      position: absolute;
      top: 0;
      right: 0;
    }

    .bottom-left {
      position: absolute;
      left: 0;
      bottom: 0;
    }

  `;
  static properties: PropertyDeclarations = { health: { type: Number } };

  @property()
  accessor health: number = 20;

  @property()
  accessor visible: boolean = false;

  left = 0;
  top = 0;
  width: number = 800;
  height: number = 600;

  public setPos(x: number, y: number) {
    this.left = x;
    this.top = y;
    this.requestUpdate();
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  protected render(): unknown {
    const styles = {
      visibility: this.visible ? 'visible' : 'hidden',
      left: `${this.left}px`,
      top: `${this.top}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    };

    return html`
    <div class="container" style=${styleMap(styles)}>

      <div class="bottom-left">
        <button>Start Wave</button>
        <button>Shop</button>
      </div>

      <div class="top-right">
          <h2>Wave 1</h2>
          <h3>Health: ${this.health}</h3>
      </div>

    </div>`
  }
}
