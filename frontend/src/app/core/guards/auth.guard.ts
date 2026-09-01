import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  const token = authService.getToken();

  if (authService.currentUser() && token && authService.isSessionValid()) {
    return true;
  }

  authService.handleSessionExpiration();
  return false;
};
