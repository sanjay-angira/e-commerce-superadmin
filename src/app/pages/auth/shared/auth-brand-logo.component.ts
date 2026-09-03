import { Component, input } from '@angular/core';

/** Brand mark mirrored from vr-admin website-logo (auth variant). */
@Component({
  selector: 'app-auth-brand-logo',
  template: `
    <div
      class="brand-logo"
      [style.--logo-color]="variant() === 'sidebar' ? '#f5f1ea' : '#18181b'"
      [style.--logo-label-color]="
        variant() === 'sidebar' ? 'rgba(245, 241, 234, 0.92)' : 'rgba(24, 24, 27, 0.82)'
      "
      [style.--logo-line-middle]="
        variant() === 'sidebar' ? 'rgba(245, 241, 234, 0.85)' : 'rgba(24, 24, 27, 0.55)'
      "
      aria-label="Vrindavan Rasa logo"
    >
      <div class="brand-logo__wordmark">Vrindavan</div>
      <div class="brand-logo__subline">
        <span class="brand-logo__line"></span>
        <span class="brand-logo__label">रस</span>
        <span class="brand-logo__line"></span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }
      .brand-logo {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 168px;
        padding: 2px 0;
        color: var(--logo-color);
      }
      .brand-logo__wordmark {
        font-family: 'Times New Roman', Georgia, serif;
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        line-height: 1;
        transform: scaleY(1.08);
      }
      .brand-logo__subline {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-top: 0.18rem;
        width: 100%;
      }
      .brand-logo__label {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 0.6rem;
        font-weight: 300;
        letter-spacing: 0.72em;
        padding-left: 0.72em;
        color: var(--logo-label-color);
      }
      .brand-logo__line {
        flex: 1;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          var(--logo-line-middle) 50%,
          transparent 100%
        );
      }
    `,
  ],
})
export class AuthBrandLogoComponent {
  readonly variant = input<'auth' | 'sidebar'>('auth');
}
