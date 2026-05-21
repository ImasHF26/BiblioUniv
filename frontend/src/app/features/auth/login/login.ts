import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading  = signal(false);
  error    = signal('');
  showPass = signal(false);

  form = this.fb.group({
    email:    ['admin@biblio.edu', [Validators.required, Validators.email]],
    password: ['admin123',         [Validators.required, Validators.minLength(4)]],
  });

  features = [
    { icon: 'menu_book',     text: 'Gestion complète des livres et collections' },
    { icon: 'group',         text: 'Gestion des étudiants et enseignants' },
    { icon: 'library_books', text: 'Suivi des emprunts et retours' },
    { icon: 'warning_amber', text: 'Gestion automatique des pénalités' },
    { icon: 'dashboard',     text: 'Tableau de bord statistique en temps réel' },
  ];

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
