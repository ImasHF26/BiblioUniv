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
import { UserService } from '../../../core/services/index';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserListComponent {
  private userSvc    = inject(UserService);
  private snack      = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  auth               = inject(AuthService);

  users        = signal<User[]>([]);
  loading      = signal(true);
  searchTerm   = '';
  selectedRole = '';

  displayedColumns = ['avatar', 'matricule', 'full_name', 'role', 'department', 'status', 'actions'];

  roleOptions = [
    { value: '',           label: 'Tous les rôles' },
    { value: 'admin',      label: 'Administrateur' },
    { value: 'librarian',  label: 'Bibliothécaire' },
    { value: 'teacher',    label: 'Enseignant' },
    { value: 'student',    label: 'Étudiant' },
  ];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.userSvc
      .getAll(this.searchTerm || undefined, this.selectedRole || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => { this.users.set(u); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onSearch() { this.load(); }

  getRoleLabel(role: UserRole): string {
    const labels: Record<string, string> = {
      admin: 'Admin', librarian: 'Bibliothécaire', teacher: 'Enseignant', student: 'Étudiant'
    };
    return labels[role] || role;
  }

  getRoleClass(role: UserRole): string { return `badge role-${role}`; }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  deleteUser(user: User) {
    if (!confirm(`Désactiver "${user.full_name}" ?`)) return;
    this.userSvc.delete(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.snack.open('Utilisateur désactivé', 'OK', { duration: 3000 }); this.load(); },
        error: (err) => this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' }),
      });
  }
}
