import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CategoryService } from '../../../core/services/index';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
    MatTooltipModule, MatCardModule, MatDividerModule,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryListComponent {
  private svc        = inject(CategoryService);
  private fb         = inject(FormBuilder);
  private snack      = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  auth               = inject(AuthService);

  categories  = signal<Category[]>([]);
  loading     = signal(true);
  editingId   = signal<number | null>(null);
  showForm    = signal(false);

  displayedColumns = ['name', 'description', 'actions'];

  form = this.fb.group({
    name:        ['', [Validators.required]],
    description: [''],
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => { this.categories.set(c); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openForm(cat?: Category) {
    this.showForm.set(true);
    if (cat) {
      this.editingId.set(cat.id);
      this.form.patchValue({ name: cat.name, description: cat.description || '' });
    } else {
      this.editingId.set(null);
      this.form.reset();
    }
  }

  closeForm() { this.showForm.set(false); this.editingId.set(null); this.form.reset(); }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const data: Partial<Category> = {
      name: raw.name ?? undefined,
      description: raw.description ?? undefined,
    };
    const req = this.editingId()
      ? this.svc.update(this.editingId()!, data)
      : this.svc.create(data);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open(this.editingId() ? 'Modifiée !' : 'Créée !', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.closeForm();
        this.load();
      },
      error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
    });
  }

  delete(cat: Category) {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    this.svc.delete(cat.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.snack.open('Supprimée !', 'OK', { duration: 3000, panelClass: 'success-snack' }); this.load(); },
        error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
      });
  }
}
