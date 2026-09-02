import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/google');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const expiredOrInvalid =
        error.status === 401 || error.status === 403;

      if (expiredOrInvalid && !isAuthEndpoint && token) {
        authService.handleSessionExpiration();
      }
      return throwError(() => error);
    })
  );
};