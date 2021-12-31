import {LitElement, css, html, unsafeCSS} from 'lit';
import {customElement, property} from 'lit/decorators.js';

interface Breakpoint {
  min?: number;
  max?: number;
  label: string;
}

export interface GridOptions {
  breakpoint: Breakpoint;
  count: number;
  margin: string;
  gutter: string;
  maxWidth?: string;
}

@customElement('grid-inspector')
export class GridInspector extends LitElement {
  static STORAGE_KEY = 'inspectorGrid';

  @property({type: Array, attribute: 'grid'})
  options?: GridOptions[];

  grid: GridOptions[];

  static DEFAULT_OPTIONS = [{
    breakpoint: {
      max: 599,
      label: 'Mobile (<599px)'
    },
    count: 4,
    margin: '16px',
    gutter: '24px',
  },
  {
    breakpoint: {
      min: 600,
      max: 1023,
      label: 'Tablet (600 - 1023px)'
    },
    count: 12,
    margin: '24px',
    gutter: '24px',
    maxWidth: '600px',
  },
  {
    breakpoint: {
      min: 1024,
      label: 'Desktop (>1024px)'
    },
    count: 12,
    margin: '24px',
    gutter: '24px',
    maxWidth: '1440px',
  }]

  constructor() {
    super();
    this.grid = this.options ?? GridInspector.DEFAULT_OPTIONS;
  }

  connectedCallback() {
    super.connectedCallback();
    // Enable toggling the grid overlay using `ctrl+g` (similar to Figma).
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'g') {
        this.toggleGridOverlay();
      }
    });
    if (localStorage.getItem(GridInspector.STORAGE_KEY)) {
      this.toggleGridOverlay();
    }
    window.addEventListener('resize', () => this.updateStyles(), {passive: true});
    window.setTimeout(() => this.updateStyles());
  }

  private toggleGridOverlay() {
    const setVisible = this.style.display != 'block';
    this.style.display = setVisible ? 'block' : 'none';
    setVisible ? localStorage.setItem(GridInspector.STORAGE_KEY, 'true') : localStorage.removeItem(GridInspector.STORAGE_KEY);
  }

  private updateStyles() {
    const width = window.innerWidth;
    const labelEl = this.shadowRoot?.querySelector('.page-grid__label');
    const columnEls = Array.from(this.shadowRoot?.querySelectorAll('.page-grid__col')!) as HTMLElement[];
    for (const grid of this.grid) {
      const min = grid.breakpoint.min ?? 0;
      const max = grid.breakpoint.max ?? Infinity;
      if (min <= width && width <= max) {
        this.style.setProperty('--page-grid-label', grid.breakpoint.label);
        this.style.setProperty('--page-grid-column-gap', grid.gutter);
        this.style.setProperty('--page-grid-column-margin', grid.margin);
        this.style.setProperty('--page-grid-num-columns', grid.count?.toString() ?? '12');
        this.style.setProperty('--page-grid-max-width', grid.maxWidth ?? '100%');
        labelEl?.setAttribute('label', grid.breakpoint.label);
        for (const [i, el] of columnEls.entries()) {
          const enabled = i < grid.count;
          el.style.display = enabled ? 'block' : 'none';
        }
      }
    }
  }

  static get styles() {
    return css`
      :host {
        display: none;
      }
      .page-grid-overlay {
        color: #000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-optical-sizing: none;
        font-size: 12px;
        font-weight: 500;
        height: 100vh;
        left: 0;
        letter-spacing: .25px;
        line-height: 20px;
        pointer-events: none;
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 2000;
      }
      .page-grid-overlay * {
        box-sizing: border-box
      }
      .page-grid-overlay .page-grid__label {
        background: #ebffff;
        margin-left: 8px;
        margin-top: 42px;
        padding: 0 8px;
        position: absolute;
        text-align: left;
      }
      .page-grid-overlay .page-grid__label::before {
        content: attr(label);
        display: block;
      }
      .page-grid-overlay .page-grid {
        column-gap: var(--page-grid-column-gap);
        counter-reset: column;
        display: grid;
        grid-template-columns: repeat(var(--page-grid-num-columns), 1fr);
        height: 100%;
        margin-left: auto;
        margin-right: auto;
        max-width: var(--page-grid-max-width);
        padding:  0 var(--page-grid-column-margin);
      }
      .page-grid-overlay .page-grid > * {
        grid-column-end: span var(--page-grid-num-columns);
      }
      [page-grid-overlay=true] .page-grid-overlay .page-grid >  * {
        box-shadow: inset 0 0 0 1px orchid;
      }
      .page-grid-overlay .page-grid__col {
        background-color: rgba(0,255,255,.08);
        display: none;
        grid-column-end: span 1;
        height: 100%;
        padding-top: 12px;
        text-align: center;
      }
      .page-grid-overlay .page-grid__col::before {
        content: counter(column);
        counter-increment: column;
      }
    `;
  }

  render() {
    return html`
      <div class="page-grid-overlay">
        <div class="page-grid">
          <div class="page-grid__label"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
          <div class="page-grid__col"></div>
        </div>
      </div>
    `;
  }
}
