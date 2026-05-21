import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { BookService, CategoryService } from '../../../core/services/index';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-book-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss',
})
export class BookFormComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private bookSvc     = inject(BookService);
  private categorySvc = inject(CategoryService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private snack       = inject(MatSnackBar);
  private destroyRef  = inject(DestroyRef);

  // Angular 21 : toSignal() pour les catégories (pas besoin de ngOnDestroy)
  categories = toSignal(this.categorySvc.getAll(), { initialValue: [] as Category[] });

  bookId  = signal<number | null>(null);
  loading = signal(false);
  saving  = signal(false);

  get isEdit(): boolean { return !!this.bookId(); }

  form = this.fb.group({
    isbn:             ['', [Validators.required]],
    title:            ['', [Validators.required]],
    author:           ['', [Validators.required]],
    publisher:        [''],
    publication_year: [null as number | null, [Validators.min(1800), Validators.max(new Date().getFullYear())]],
    category_id:      [null as number | null],
    total_copies:     [1,  [Validators.required, Validators.min(1)]],
    description:      [''],
    cover_url:        [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookId.set(+id);
      this.loading.set(true);
      this.bookSvc.getById(+id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (book) => { this.form.patchValue(book as any); this.loading.set(false); },
          error: () => { this.loading.set(false); this.router.navigate(['/books']); },
        });
    }
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const data: any = { ...this.form.value };
    const req = this.isEdit
      ? this.bookSvc.update(this.bookId()!, data)
      : this.bookSvc.create(data);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open(
          this.isEdit ? 'Livre modifié !' : 'Livre ajouté !',
          'OK',
          { duration: 3000, panelClass: 'success-snack' }
        );
        this.router.navigate(['/books']);
      },
      error: (err) => {
        this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' });
        this.saving.set(false);
      },
    });
  }
}
