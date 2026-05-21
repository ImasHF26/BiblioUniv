import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'books',
        loadComponent: () => import('./features/books/book-list/book-list').then(m => m.BookListComponent),
      },
      {
        path: 'books/new',
        loadComponent: () => import('./features/books/book-form/book-form').then(m => m.BookFormComponent),
      },
      {
        path: 'books/:id/edit',
        loadComponent: () => import('./features/books/book-form/book-form').then(m => m.BookFormComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list').then(m => m.CategoryListComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list').then(m => m.UserListComponent),
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form').then(m => m.UserFormComponent),
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form').then(m => m.UserFormComponent),
      },
      {
        path: 'borrowings',
        loadComponent: () => import('./features/borrowings/borrowing-list/borrowing-list').then(m => m.BorrowingListComponent),
      },
      {
        path: 'borrowings/new',
        loadComponent: () => import('./features/borrowings/borrowing-form/borrowing-form').then(m => m.BorrowingFormComponent),
      },
      {
        path: 'penalties',
        loadComponent: () => import('./features/penalties/penalty-list/penalty-list').then(m => m.PenaltyListComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
