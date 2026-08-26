import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    // Si venimos de una expiración automática, mostramos el mensaje.
    const sessionExpiredMessage = this.authService.sessionExpiredMessage;
    if (sessionExpiredMessage) {
      this.errorMessage = sessionExpiredMessage;
      this.authService.sessionExpiredMessage = null; // limpiar para la próxima visita
    }
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