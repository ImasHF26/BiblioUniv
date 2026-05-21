import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { BorrowingService } from '../../../core/services/index';
import { AuthService } from '../../../core/services/auth.service';
import { Borrowing } from '../../../core/models';

@Component({
  selector: 'app-borrowing-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule, MatChipsModule,
  ],
  templateUrl: './borrowing-list.html',
  styleUrl: './borrowing-list.scss',
})
export class BorrowingListComponent {
  private svc        = inject(BorrowingService);
  private snack      = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  auth               = inject(AuthService);

  borrowings     = signal<Borrowing[]>([]);
  loading        = signal(true);
  selectedStatus = '';

  displayedColumns = ['user', 'book', 'borrow_date', 'due_date', 'status', 'penalty', 'actions'];

  statusOptions = [
    { value: '',         label: 'Tous' },
    { value: 'active',   label: 'Actifs' },
    { value: 'overdue',  label: 'En retard' },
    { value: 'returned', label: 'Retournés' },
  ];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.selectedStatus || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (b) => { this.borrowings.set(b); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  returnBook(b: Borrowing) {
    if (!confirm(`Confirmer le retour de "${b.book?.title}" ?`)) return;
    this.svc.returnBook(b.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snack.open('Retour enregistré !', 'OK', { duration: 3000, panelClass: 'success-snack' });
          this.load();
        },
        error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
      });
  }

  isOverdue(b: Borrowing): boolean {
    return b.status === 'active' && new Date(b.due_date) < new Date();
  }

  getDaysInfo(b: Borrowing): string {
    const today = new Date();
    const due = new Date(b.due_date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (b.status === 'returned') return 'Retourné';
    if (diff < 0) return `${Math.abs(diff)} j. de retard`;
    if (diff === 0) return 'Aujourd\'hui';
    return `dans ${diff} j.`;
  }

  getStatusClass(b: Borrowing): string {
    if (b.status === 'returned') return 'badge badge-returned';
    if (b.status === 'overdue' || this.isOverdue(b)) return 'badge badge-overdue';
    return 'badge badge-active';
  }

  getStatusLabel(b: Borrowing): string {
    if (b.status === 'returned') return 'Retourné';
    if (b.status === 'overdue' || this.isOverdue(b)) return 'En retard';
    return 'Actif';
  }

  getEstimatedPenalty(b: Borrowing): number | null {
    if (b.status === 'returned') return null;
    const today = new Date();
    const due = new Date(b.due_date);
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;
    return diffDays * 5; // 5 MAD/jour
  }

  totalEstimatedPenalties(): number {
    return this.borrowings().reduce((sum, b) => {
      const p = this.getEstimatedPenalty(b);
      return sum + (p || 0);
    }, 0);
  }
}
