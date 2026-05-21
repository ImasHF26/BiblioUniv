import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { DashboardService } from '../../core/services/index';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Angular 21 : OnPush par défaut avec Signals (zéro détection inutile)
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, DecimalPipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private svc  = inject(DashboardService);
  auth          = inject(AuthService);

  // Angular 21 : toSignal() convertit un Observable en Signal
  // (destruction automatique via DestroyRef injecté par toSignal)
  stats         = toSignal(this.svc.getStats());
  recentBorrows = toSignal(this.svc.getRecentBorrowings(), { initialValue: [] });
  topBooks      = toSignal(this.svc.getTopBooks(), { initialValue: [] });

  // Angular 21 : computed() se recalcule automatiquement quand stats() change
  loading = computed(() => this.stats() === undefined);

  displayedColumns = ['user_name', 'book_title', 'borrow_date', 'due_date', 'status'];

  statCards = [
    { key: 'total_books',         label: 'Total Livres',         icon: 'menu_book',     color: '#162535' },
    { key: 'available_books',     label: 'Disponibles',          icon: 'check_circle',  color: '#1B5E20' },
    { key: 'active_borrowings',   label: 'Emprunts actifs',      icon: 'library_books', color: '#1565C0' },
    { key: 'overdue_borrowings',  label: 'En retard',            icon: 'schedule',      color: '#BF360C' },
    { key: 'total_users',         label: 'Utilisateurs',         icon: 'group',         color: '#4A148C' },
    { key: 'pending_penalties',   label: 'Pénalités en attente', icon: 'warning_amber', color: '#E65100' },
  ];

  getStatValue(key: string): number {
    return (this.stats() as any)?.[key] ?? 0;
  }

  getStatusClass(status: string): string {
    return `badge badge-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Actif', returned: 'Retourné', overdue: 'En retard'
    };
    return labels[status] || status;
  }
}
