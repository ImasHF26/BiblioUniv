import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { map } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { BorrowingService, UserService, BookService } from '../../../core/services/index';
import { User, Book } from '../../../core/models';

@Component({
  selector: 'app-borrowing-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatDatepickerModule,
  ],
  templateUrl: './borrowing-form.html',
  styleUrl: './borrowing-form.scss',
})
export class BorrowingFormComponent {
  private fb         = inject(FormBuilder);
  private svc        = inject(BorrowingService);
  private userSvc    = inject(UserService);
  private bookSvc    = inject(BookService);
  private router     = inject(Router);
  private snack      = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  // Angular 21 : toSignal() — conversion Observable → Signal sans ngOnDestroy
  users = toSignal(
    this.userSvc.getAll().pipe(map(u => u.filter(u => u.is_active))),
    { initialValue: [] as User[] }
  );
  books = toSignal(
    this.bookSvc.getAll(undefined, undefined, true),
    { initialValue: [] as Book[] }
  );

  saving  = signal(false);
  minDate = new Date();

  form = this.fb.group({
    user_id:  [null as number | null, [Validators.required]],
    book_id:  [null as number | null, [Validators.required]],
    due_date: [null as Date | null,   [Validators.required]],
    notes:    [''],
  });

  getUserLabel(u: User): string { return `${u.full_name} (${u.matricule})`; }
  getBookLabel(b: Book): string { return `${b.title} — ${b.author} [${b.available_copies} dispo.]`; }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const val = this.form.value;
    const dueDate = val.due_date as Date;
    const payload = {
      user_id:  val.user_id,
      book_id:  val.book_id,
      due_date: dueDate.toISOString().split('T')[0],
      notes:    val.notes || null,
    };

    this.svc.create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snack.open('Emprunt créé !', 'OK', { duration: 3000, panelClass: 'success-snack' });
          this.router.navigate(['/borrowings']);
        },
        error: (err) => {
          this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' });
          this.saving.set(false);
        },
      });
  }
}
