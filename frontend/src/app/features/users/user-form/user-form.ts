import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../core/services/index';

@Component({
  selector: 'app-user-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private userSvc    = inject(UserService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private snack      = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  userId  = signal<number | null>(null);
  loading = signal(false);
  saving  = signal(false);

  get isEdit(): boolean { return !!this.userId(); }

  roles = [
    { value: 'student',   label: 'Étudiant' },
    { value: 'teacher',   label: 'Enseignant' },
    { value: 'librarian', label: 'Bibliothécaire' },
    { value: 'admin',     label: 'Administrateur' },
  ];

  form = this.fb.group({
    matricule:   ['', [Validators.required]],
    email:       ['', [Validators.required, Validators.email]],
    full_name:   ['', [Validators.required]],
    role:        ['student', [Validators.required]],
    department:  [''],
    phone:       [''],
    password:    ['', [Validators.minLength(6)]],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(+id);
      this.loading.set(true);
      this.userSvc.getById(+id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (u) => { this.form.patchValue(u as any); this.loading.set(false); },
          error: () => { this.loading.set(false); this.router.navigate(['/users']); },
        });
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const data: any = { ...this.form.value };
    if (!data.password) delete data.password;

    const req = this.isEdit
      ? this.userSvc.update(this.userId()!, data)
      : this.userSvc.create(data);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open(this.isEdit ? 'Modifié !' : 'Créé !', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.snack.open(err.message, 'Fermer', { duration: 5000, panelClass: 'error-snack' });
        this.saving.set(false);
      },
    });
  }
}
