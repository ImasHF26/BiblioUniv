import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith, combineLatest } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { BookService, CategoryService } from '../../../core/services/index';
import { AuthService } from '../../../core/services/auth.service';
import { Book, Category } from '../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookListComponent {
  private bookSvc     = inject(BookService);
  private categorySvc = inject(CategoryService);
  private snack       = inject(MatSnackBar);
  private destroyRef  = inject(DestroyRef);
  auth                = inject(AuthService);

  // Angular 21 : toSignal() avec destroyRef automatique
  categories = toSignal(this.categorySvc.getAll(), { initialValue: [] as Category[] });

  books      = signal<Book[]>([]);
  loading    = signal(true);

  searchTerm    = '';
  selectedCat   = '';
  availableOnly = false;

  displayedColumns = ['cover', 'title', 'author', 'category', 'copies', 'available', 'actions'];

  constructor() {
    // Charger les livres au démarrage
    this.loadBooks();
  }

  loadBooks() {
    this.loading.set(true);
    this.bookSvc
      .getAll(
        this.searchTerm || undefined,
        this.selectedCat ? +this.selectedCat : undefined,
        this.availableOnly || undefined,
      )
      // Angular 21 : takeUntilDestroyed() se passe de ngOnDestroy()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (b) => { this.books.set(b); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onSearch() { this.loadBooks(); }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCat = '';
    this.availableOnly = false;
    this.loadBooks();
  }

  deleteBook(book: Book) {
    if (!confirm(`Supprimer "${book.title}" ?`)) return;
    this.bookSvc.delete(book.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snack.open('Livre supprimé', 'OK', { duration: 3000, panelClass: 'success-snack' });
          this.loadBooks();
        },
        error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
      });
  }

  getAvailabilityClass(book: Book): string {
    if (book.available_copies === 0) return 'badge badge-overdue';
    if (book.available_copies < book.total_copies) return 'badge badge-active';
    return 'badge badge-returned';
  }

  getAvailabilityLabel(book: Book): string {
    if (book.available_copies === 0) return 'Indisponible';
    if (book.available_copies < book.total_copies) return 'Partiel';
    return 'Disponible';
  }

  getCoverLetter(title: string): string {
    return title.charAt(0).toUpperCase();
  }
}
