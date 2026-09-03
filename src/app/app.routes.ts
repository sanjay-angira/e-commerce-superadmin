import { Routes } from '@angular/router';
import { authGuardUser, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuardUser],
    loadComponent: () =>
      import('./custom-layout/custom-layout.component').then((m) => m.CustomLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-analytics/dashboard-analytics.component').then(
            (m) => m.DashboardAnalyticsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/social/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/components/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'footer-settings',
        loadComponent: () =>
          import('./pages/components/footer-settings/footer-settings.component').then(
            (m) => m.FooterSettingsComponent
          ),
      },
      {
        path: 'website-layout',
        loadComponent: () =>
          import('./pages/components/website-layout/website-layout.component').then(
            (m) => m.WebsiteLayoutComponent
          ),
      },
      {
        path: 'website-layout/add',
        loadComponent: () =>
          import(
            './pages/components/website-layout/add-update/website-layout-form.component'
          ).then((m) => m.WebsiteLayoutFormComponent),
      },
      {
        path: 'website-layout/modify/:id',
        loadComponent: () =>
          import(
            './pages/components/website-layout/add-update/website-layout-form.component'
          ).then((m) => m.WebsiteLayoutFormComponent),
      },
      {
        path: 'orders/view/:id',
        loadComponent: () =>
          import('./pages/components/orders/view/order-view.component').then(
            (m) => m.OrderViewComponent
          ),
      },
      {
        path: 'module-order',
        loadComponent: () =>
          import('./pages/components/module-order/module-order.component').then(
            (m) => m.ModuleOrderComponent
          ),
      },
      // Config-driven CRUD — mirrors vr-frontend /admin/[module]
      {
        path: ':module',
        loadComponent: () =>
          import('./pages/components/module-crud/module-list.component').then(
            (m) => m.ModuleListComponent
          ),
      },
      {
        path: ':module/add',
        loadComponent: () =>
          import('./pages/components/module-crud/module-form.component').then(
            (m) => m.ModuleFormComponent
          ),
      },
      {
        path: ':module/edit/:id',
        loadComponent: () =>
          import('./pages/components/module-crud/module-form.component').then(
            (m) => m.ModuleFormComponent
          ),
      },
      {
        path: ':module/view/:id',
        loadComponent: () =>
          import('./pages/components/module-crud/module-view.component').then(
            (m) => m.ModuleViewComponent
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/errors/error-404/error-404.component').then((m) => m.Error404Component),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/errors/error-404/error-404.component').then((m) => m.Error404Component),
  },
];
