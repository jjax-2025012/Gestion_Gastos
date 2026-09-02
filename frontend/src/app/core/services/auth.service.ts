import { Injectable, signal, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subscription, timer, tap } from 'rxjs';
import { LoginResponse, RegisterRequest, User } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  public currentUser = signal<User | null>(this.getUserFromStorage());
  public sessionExpiredMessage: string | null = null;
  private timerSubscription?: Subscription;

  constructor() {
    this.initSessionWatch();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.checkTokenExpirationNow());
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.checkTokenExpirationNow();
      });
    }
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  /**
   * Intercambia el ID Token emitido por Google por el JWT del sistema.
   * El backend valida la firma y crea la cuenta automáticamente si no existía.
   */
  googleLogin(idToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/google`, { idToken }).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  clearSession(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  handleSessionExpiration(): void {
    this.clearSession();
    this.sessionExpiredMessage = 'Su sesión ha expirado. Por favor, inicia sesión nuevamente.';

    this.ngZone.run(() => {
      this.router.navigate(['/login'], {
        queryParams: { sessionExpired: 'true' }
      });
    });
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  isSessionValid(): boolean {
    const expiration = this.getTokenExpirationMs(this.getToken());
    return expiration !== null && expiration > Date.now();
  }

  private setSession(authResult: LoginResponse): void {
    const tokenPayload = this.decodeTokenPayload(authResult.token);
    const avatar = authResult.user.picture || authResult.user.avatar_url || authResult.user.avatar || authResult.user.avatarUrl || tokenPayload['picture'] || tokenPayload['avatar_url'];
    const user = { ...authResult.user, avatar, picture: authResult.user.picture || avatar, avatar_url: authResult.user.avatar_url || avatar, avatarUrl: authResult.user.avatarUrl || avatar };
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
    this.scheduleExpirationTimer();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private initSessionWatch(): void {
    const token = this.getToken();
    if (!token) return;
    this.scheduleExpirationTimer();
  }

  private checkTokenExpirationNow(): void {
    const token = this.getToken();
    if (!token) return;

    const expiration = this.getTokenExpirationMs(token);
    if (expiration === null || expiration <= Date.now()) {
      this.handleSessionExpiration();
    }
  }

  private scheduleExpirationTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    const expiration = this.getTokenExpirationMs(this.getToken());
    if (expiration === null) {
      this.handleSessionExpiration();
      return;
    }

    const remainingMs = expiration - Date.now();

    if (remainingMs <= 0) {
      this.handleSessionExpiration();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.timerSubscription = timer(remainingMs).subscribe(() => {
        this.handleSessionExpiration();
      });
    });
  }

  private getTokenExpirationMs(token: string | null): number | null {
    if (!token) return null;
    try {
      const payload = this.decodeTokenPayload(token);
      return typeof payload['exp'] === 'number' ? payload['exp'] * 1000 : null;
    } catch {
      return null;
    }
  }

  private decodeTokenPayload(token: string | null): Record<string, any> {
    if (!token) return {};
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return {};
    }
  }
}
