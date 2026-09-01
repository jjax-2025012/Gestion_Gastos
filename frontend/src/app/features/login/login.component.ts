import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const sessionExpired = params.get('sessionExpired') === 'true';
      const unauthorized = params.get('unauthorized') === 'true';

      if (sessionExpired) {
        this.errorMessage = 'Su sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (unauthorized) {
        this.errorMessage = 'Debes iniciar sesión para acceder a esta sección.';
      } else if (this.authService.sessionExpiredMessage) {
        this.errorMessage = this.authService.sessionExpiredMessage;
        this.authService.sessionExpiredMessage = null;
      }
    });
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Credenciales incorrectas o error en el servidor.';
      }
    });
  }
}