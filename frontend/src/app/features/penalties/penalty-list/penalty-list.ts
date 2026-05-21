import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { PenaltyService, BorrowingService } from '../../../core/services/index';
import { AuthService } from '../../../core/services/auth.service';
import { Penalty, Borrowing } from '../../../core/models';

export interface EstimatedPenalty {
  borrowing: Borrowing;
  daysLate: number;
  amount: number;
}

@Component({
  selector: 'app-penalty-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DecimalPipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule, MatChipsModule,
  ],
  templateUrl: './penalty-list.html',
  styleUrl: './penalty-list.scss',
})
export class PenaltyListComponent {
  private penaltySvc   = inject(PenaltyService);
  private borrowingSvc = inject(BorrowingService);
  private snack        = inject(MatSnackBar);
  private destroyRef   = inject(DestroyRef);
  auth                 = inject(AuthService);

  penalties          = signal<Penalty[]>([]);
  estimatedPenalties = signal<EstimatedPenalty[]>([]);
  loading            = signal(true);
  filterPaid         = '';

  displayedColumns = ['borrower', 'book', 'amount', 'reason', 'status', 'date', 'actions'];
  estimatedColumns = ['borrower', 'book', 'days_late', 'amount', 'info'];

  filterOptions = [
    { value: '',      label: 'Toutes' },
    { value: 'false', label: 'Non payées' },
    { value: 'true',  label: 'Payées' },
  ];

  totalUnpaid = computed(() =>
    this.penalties().filter(p => !p.is_paid).reduce((s, p) => s + p.amount, 0)
  );

  totalEstimated = computed(() =>
    this.estimatedPenalties().reduce((s, ep) => s + ep.amount, 0)
  );

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    const isPaid = this.filterPaid === '' ? undefined : this.filterPaid === 'true';

    // Load confirmed penalties
    this.penaltySvc.getAll(isPaid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => { this.penalties.set(p); this.loading.set(false); },
        error: () => this.loading.set(false),
      });

    // Load overdue borrowings for estimated penalties
    this.borrowingSvc.getAll('overdue')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (borrowings) => {
          const today = new Date();
          const estimated: EstimatedPenalty[] = [];
          for (const b of borrowings) {
            if (b.status === 'returned') continue;
            const due = new Date(b.due_date);
            const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              estimated.push({
                borrowing: b,
                daysLate: diffDays,
                amount: diffDays * 5,
              });
            }
          }
          this.estimatedPenalties.set(estimated);
        },
      });
  }

  pay(p: Penalty) {
    if (!confirm(`Marquer la pénalité de ${p.amount} MAD comme payée ?`)) return;
    this.penaltySvc.pay(p.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snack.open('Pénalité payée !', 'OK', { duration: 3000, panelClass: 'success-snack' });
          this.load();
        },
        error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
      });
  }
}
