import {LitElement, css, html} from 'lit';

import {customElement} from 'lit/decorators.js';

@customElement('grid-inspector')
export class GridInspector extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // Enable toggling the grid overlay using `ctrl+g` (similar to Figma).
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'g') {
        this.toggleGridOverlay();
      }
    });
  }

  private toggleGridOverlay() {
    this.style.display = this.style.display === 'none' ? 'block' : 'none';
  }

  static get styles() {
    return css`
      :host {
          display:none
      }
      .page-grid-overlay {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-size: 12px;
        font-weight: 500;
        color:#000;
        font-optical-sizing:none;
        font-size:14px;
        font-weight:500;
        height:100vh;
        left:0;
        letter-spacing:.25px;
        line-height:20px;
        pointer-events:none;
        position:fixed;
        top:0;
        width:100%;
        z-index:2000;
      }
      .page-grid-overlay * {
        box-sizing:border-box
      }
      .page-grid-overlay .page-grid__label {
        display:none;
        margin-top:42px;
        margin-left:8px;
        padding:0 8px;
        background:#ebffff;
        position:absolute;
        text-align:left
      }
      .page-grid-overlay .opt--mobile::before {
        content:"Mobile (320 - 599px)"
      }
      @media(max-width: 599px) {
        .page-grid-overlay .opt--mobile {
            display:block
        }
      }
      .page-grid-overlay .opt--ds-tablet::before {
        content:"Tablet (600 - 1023px)"
      }
      @media(min-width: 600px)and (max-width: 1023px) {
        .page-grid-overlay .opt--ds-tablet {
            display:block
        }
      }
      .page-grid-overlay .opt--ds-laptop::before {
        content:"Laptop (1024 - 1439px)"
      }
      @media(min-width: 1024px)and (max-width: 1439px) {
        .page-grid-overlay .opt--ds-laptop {
            display:block
        }
      }
      .page-grid-overlay .opt--ds-desktop::before {
          content:"Desktop (1440px)"
      }
      @media(min-width: 1440px) {
          .page-grid-overlay .opt--ds-desktop {
              display:block
          }
      }
      .page-grid-overlay .page-grid {
          display:grid;
          -webkit-column-gap:24px;
          -moz-column-gap:24px;
          column-gap:24px;
          counter-reset:column;
          height:100%
      }
      @media(max-width: 599px) {
          .page-grid-overlay .page-grid {
              grid-template-columns:repeat(4, 1fr);
              padding:0 16px
          }
      }
      @media(min-width: 600px)and (max-width: 1023px) {
          .page-grid-overlay .page-grid {
              grid-template-columns:repeat(12, 1fr);
              margin-left:auto;
              margin-right:auto;
              max-width:600px;
              padding:0 24px
          }
      }
      @media(min-width: 1024px)and (max-width: 1439px) {
          .page-grid-overlay .page-grid {
              grid-template-columns:repeat(12, 1fr);
              padding:0 24px
          }
      }
      @media(min-width: 1440px) {
          .page-grid-overlay .page-grid {
              grid-template-columns:repeat(12, 1fr);
              margin-left:auto;
              margin-right:auto;
              max-width:1440px;
              padding:0 24px
          }
      }
      @media(max-width: 599px) {
          .page-grid-overlay .page-grid>* {
              grid-column-end:span 4
          }
      }
      @media(min-width: 600px) {
          .page-grid-overlay .page-grid>* {
              grid-column-end:span 12
          }
      }
      [page-grid-overlay=true] .page-grid-overlay .page-grid>* {
          box-shadow:inset 0 0 0 1px orchid
      }
      .page-grid-overlay .page-grid__col {
          grid-column-end:span 1;
          background-color:rgba(0,255,255,.08);
          height:100%;
          padding-top:12px;
          text-align:center
      }
      .page-grid-overlay .page-grid__col::before {
          counter-increment:column;
          content:counter(column)
      }
      @media(max-width: 599px) {
          .page-grid-overlay .page-grid__col:nth-child(5),.page-grid-overlay .page-grid__col:nth-child(6),.page-grid-overlay .page-grid__col:nth-child(7),.page-grid-overlay .page-grid__col:nth-child(8),.page-grid-overlay .page-grid__col:nth-child(9),.page-grid-overlay .page-grid__col:nth-child(10),.page-grid-overlay .page-grid__col:nth-child(11),.page-grid-overlay .page-grid__col:nth-child(12) {
              display:none
          }
      }
    `;
  }

  render() {
    return html`
      <div class="page-grid-overlay">
        <div class="page-grid">
          <div class="page-grid__label opt--mobile"></div>
          <div class="page-grid__label opt--ds-tablet"></div>
          <div class="page-grid__label opt--ds-laptop"></div>
          <div class="page-grid__label opt--ds-desktop"></div>
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
