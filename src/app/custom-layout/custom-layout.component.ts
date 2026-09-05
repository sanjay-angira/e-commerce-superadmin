import { Component, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { LoginService } from '../core/services/login.service';
import { NavigationService } from '../core/services/navigation.service';
import { AdminMenuSection } from '../../static-data/admin-menu';
import { AuthBrandLogoComponent } from '../pages/auth/shared/auth-brand-logo.component';
import { ThemeToggleComponent } from '../pages/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-custom-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    AuthBrandLogoComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './custom-layout.component.html',
  styleUrl: './custom-layout.component.scss',
})
export class CustomLayoutComponent implements OnInit {
  private readonly login = inject(LoginService);
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly bp = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly sections = this.navigation.sections;
  readonly menuLoading = this.navigation.loading;
  readonly displayName = signal(this.login.displayName);
  readonly openTitles = signal<Set<string>>(new Set());
  readonly isHandset = toSignal(
    this.bp.observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  private readonly routeMatchOptions = {
    paths: 'subset' as const,
    queryParams: 'ignored' as const,
    fragment: 'ignored' as const,
    matrixParams: 'ignored' as const,
  };

  constructor() {
    effect(() => {
      const sections = this.sections();
      const searching = this.navigation.searchActive();
      untracked(() => this.syncAccordion(sections, searching));
    });
  }

  ngOnInit(): void {
    this.navigation.load();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncAccordion(this.sections(), this.navigation.searchActive()));

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const query = (value || '').trim();
        if (query.length > 3) {
          this.navigation.searchActive.set(true);
          this.navigation.load(query);
          return;
        }
        if (this.navigation.searchActive() || !query.length) {
          this.navigation.searchActive.set(false);
          this.navigation.load();
        }
      });
  }

  isOpen(title: string): boolean {
    return this.openTitles().has(title);
  }

  isSectionActive(section: AdminMenuSection): boolean {
    return this.sectionHasActiveChild(section);
  }

  toggleSection(title: string): void {
    this.openTitles.update((current) => {
      if (current.has(title)) {
        const next = new Set(current);
        next.delete(title);
        return next;
      }

      const next = new Set<string>();
      const active = this.findActiveSectionTitle(this.sections());
      if (active) {
        next.add(active);
      }
      next.add(title);
      return next;
    });
  }

  private syncAccordion(sections: AdminMenuSection[], searching: boolean): void {
    if (searching) {
      this.openTitles.set(new Set(sections.filter((section) => section.items.length).map((section) => section.title)));
      return;
    }

    const active = this.findActiveSectionTitle(sections);
    this.openTitles.set(active ? new Set([active]) : new Set());
  }

  private findActiveSectionTitle(sections: AdminMenuSection[]): string | null {
    const match = sections.find((section) => this.sectionHasActiveChild(section));
    return match?.title ?? null;
  }

  private sectionHasActiveChild(section: AdminMenuSection): boolean {
    return section.items.some((item) => this.router.isActive(item.href, this.routeMatchOptions));
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  logout(): void {
    this.login.logout();
  }
}
