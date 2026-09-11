import { Component, input } from '@angular/core';

/** BazarBaazi lockup — auth cards and the dark sidebar. */
@Component({
  selector: 'app-auth-brand-logo',
  template: `
    <div
      class="brand-logo"
      [class.brand-logo--sidebar]="variant() === 'sidebar'"
    >
      <img
        class="brand-logo__mark"
        src="/brand/bazarbaazi-lockup-clear.png"
        alt="BazarBaazi — Har Zaroorat, Ek Bazar"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        max-width: 100%;
      }
      .brand-logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        max-width: 100%;
      }
      .brand-logo__mark {
        display: block;
        height: 56px;
        width: auto;
        max-width: min(280px, 100%);
        min-width: 0;
        object-fit: contain;
      }
      /* White artwork on transparent; invert on light auth cards. */
      .brand-logo:not(.brand-logo--sidebar) .brand-logo__mark {
        filter: invert(1);
      }
      :host-context(html[data-theme='dark']) .brand-logo:not(.brand-logo--sidebar) .brand-logo__mark {
        filter: none;
      }
      .brand-logo--sidebar .brand-logo__mark {
        height: 42px;
        max-width: min(240px, 100%);
        filter: none;
      }
    `,
  ],
})
export class AuthBrandLogoComponent {
  readonly variant = input<'auth' | 'sidebar'>('auth');
}
