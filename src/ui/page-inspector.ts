import {LitElement, css, html} from 'lit';
import {customElement, query} from 'lit/decorators.js';

import { AttributeHighlighter } from './attribute-highlighter';
import { GridInspector } from './grid-inspector';
import { MarginOutliner } from './margin-outliner';

const ELEMENTS = [AttributeHighlighter, GridInspector, MarginOutliner];

@customElement('page-inspector')
export class PageInspector extends LitElement {
  @query('.page-inspector')
  root?: HTMLElement;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '?') {
        this.toggleShortcutHelper();
      }
    });
    window.addEventListener('resize', () => {
      this.requestUpdate();
    }, {passive: true});
  }

  static get styles() {
    return css`
      .page-inspector:not(.active) {
        display: none;
      }

      .page-inspector__viewport {
        background-color: white;
        border-bottom-left-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-size: 12px;
        line-height: 16px;
        padding: 10px;
        position: fixed;
        right: 0;
        top: 0;
        z-index: 9999;
      }

      .page-inspector__shortcuts {
        background-color: white;
        border-radius: 8px;
        border: 1px solid #ccc;
        bottom: 15px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-size: 12px;
        line-height: 16px;
        font-weight: 500;
        left: 15px;
        padding: 15px;
        position: fixed;
        z-index: 9999;
      }

      .page-inspector__shortcuts__row {
        display: flex;
      }

      .page-inspector__shortcuts__label {
        text-align: right;
        width: 45px;
        padding-right: 20px;
      }
    `;
  }

  toggleShortcutHelper() {
    const activeClassName = 'active';
    this.root?.classList.toggle(activeClassName);
  }

  get aspect() {
    return `${window.innerWidth}x${window.innerHeight}`;
  }

  render() {
    return html`
      <div class="page-inspector">
        <div class="page-inspector__viewport">
          Screen size ${this.aspect}
        </div>
        <div class="page-inspector__shortcuts">
          <div class="page-inspector__shortcuts__row">
            <div class="page-inspector__shortcuts__label">Ctrl+G</div>
            <div class="page-inspector__shortcuts__description">Toggle layout grids</div>
          </div>
          <div class="page-inspector__shortcuts__row">
            <div class="page-inspector__shortcuts__label">Ctrl+M</div>
            <div class="page-inspector__shortcuts__description">Toggle internal margins</div>
          </div>
          <div class="page-inspector__shortcuts__row">
            <div class="page-inspector__shortcuts__label">Ctrl+A</div>
            <div class="page-inspector__shortcuts__description">Toggle accessibility labels</div>
          </div>
        </div>
        <grid-inspector></grid-inspector>
        <margin-outliner></margin-outliner>
        <attribute-highlighter></attribute-highlighter>
      </div>
    `;
  }
}
