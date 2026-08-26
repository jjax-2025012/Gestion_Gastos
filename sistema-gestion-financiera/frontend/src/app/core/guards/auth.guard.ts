import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica si hay un usuario activo en el Signal de AuthService
  if (authService.currentUser()) {
    return true;
  }

  // Si no está autenticado, redirige al login
  router.navigate(['/login']);
  return false;
};