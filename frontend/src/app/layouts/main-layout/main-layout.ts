import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  auth = inject(AuthService);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard',      route: '/dashboard' },
    { label: 'Livres',          icon: 'menu_book',       route: '/books' },
    { label: 'Catégories',      icon: 'category',        route: '/categories' },
    { label: 'Utilisateurs',    icon: 'group',           route: '/users',      adminOnly: true },
    { label: 'Emprunts',        icon: 'library_books',   route: '/borrowings' },
    { label: 'Pénalités',       icon: 'warning_amber',   route: '/penalties' },
  ];

  get visibleNav(): NavItem[] {
    return this.navItems.filter(n => !n.adminOnly || this.auth.isAdmin());
  }

  get userName(): string {
    return this.auth.user()?.full_name || '';
  }

  get userRole(): string {
    const roles: Record<string, string> = {
      admin: 'Administrateur', librarian: 'Bibliothécaire',
      teacher: 'Enseignant', student: 'Étudiant'
    };
    return roles[this.auth.user()?.role || ''] || '';
  }

  logout() { this.auth.logout(); }
}
