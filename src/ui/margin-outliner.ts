import * as dom from '@blinkk/degu/lib/dom/dom';
import * as func from '@blinkk/degu/lib/func/func';

import {LitElement, css, html} from 'lit';

import {MarginOutliner as DeguMarginOutliner} from '@blinkk/degu/lib/ui/margin-outliner';
import {customElement} from 'lit/decorators.js';

// Adds required styles to page only ever once.
const addStylesToPage = func.runOnlyOnce(() => {
  dom.addStylesToPage(`
    .margin-outliner-spacer {
      align-items: center;
      background: rgba(26,115,232, 0.15);
      box-shadow: none !important;
      display: flex;
      font-size: 12px;
      height: var(--height);
      justify-content: center;
      left: var(--left);
      margin: 0 !important;
      pointer-events: none;
      position: fixed !important;
      top: var(--top);
      width: var(--width);
      z-index: 9;
    }

    .margin-outliner-spacer--padding {
      background: rgba(255, 255, 0, .15);
    }
  `);
});

@customElement('margin-outliner')
export class MarginOutliner extends LitElement {
  private marginOutliner?: DeguMarginOutliner;
  private show = false;

  connectedCallback() {
    super.connectedCallback();

    // Add styles to page.
    addStylesToPage();

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        this.toggleMarginOutliner();
      }
    });
  }

  private toggleMarginOutliner() {
    this.show = !this.show;
    if (this.show) {
      this.marginOutliner = new DeguMarginOutliner({
        sizes: [4, 8, 12, 16, 20, 24, 32, 40, 60, 80],
        cssClassName: 'margin-outliner-spacer',
        querySelector: 'page-builder div',
      });
      this.marginOutliner.run();
    } else {
      this.marginOutliner?.dispose();
    }
  }

  createRenderRoot() {
    return this;
  }
}
