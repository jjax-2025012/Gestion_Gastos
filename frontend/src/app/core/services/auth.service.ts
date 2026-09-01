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
  private readonly STORAGE_KEY_ISSUED_AT = 'token_issued_at';

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
    localStorage.removeItem(this.STORAGE_KEY_ISSUED_AT);
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
    const issuedAt = this.getIssuedAtFromStorage();
    if (issuedAt === null) return false;
    return (Date.now() - issuedAt) < this.getTokenTimeoutMs();
  }

  private getTokenTimeoutMs(): number {
    const envDuration = (environment as any).tokenTimeoutMs;
    const parsed = this.parseDurationToMs(envDuration);
    return parsed === null ? 900_000 : parsed;
  }

  private parseDurationToMs(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value !== 'string') return null;

    const match = value
      .trim()
      .toLowerCase()
      .match(/^(\d+(?:\.\d+)?)\s*(ms|s|secs?|seconds?|m|mins?|minutes?|h|hrs?|hours?|d|days?)?$/);

    if (!match) return null;

    const amount = parseFloat(match[1]);
    const unit = match[2] || 'ms';

    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1_000,
      sec: 1_000,
      secs: 1_000,
      second: 1_000,
      seconds: 1_000,
      m: 60_000,
      min: 60_000,
      mins: 60_000,
      minute: 60_000,
      minutes: 60_000,
      h: 3_600_000,
      hr: 3_600_000,
      hrs: 3_600_000,
      hour: 3_600_000,
      hours: 3_600_000,
      d: 86_400_000,
      day: 86_400_000,
      days: 86_400_000,
    };

    return amount * multipliers[unit];
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    localStorage.setItem(this.STORAGE_KEY_ISSUED_AT, Date.now().toString());
    this.currentUser.set(authResult.user);
    this.scheduleExpirationTimer();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private getIssuedAtFromStorage(): number | null {
    const raw = localStorage.getItem(this.STORAGE_KEY_ISSUED_AT);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  }

  private initSessionWatch(): void {
    const token = this.getToken();
    if (!token) return;

    const issuedAt = this.getIssuedAtFromStorage();
    if (issuedAt === null) {
      this.handleSessionExpiration();
      return;
    }

    this.scheduleExpirationTimer();
  }

  private checkTokenExpirationNow(): void {
    const token = this.getToken();
    if (!token) return;

    const issuedAt = this.getIssuedAtFromStorage();
    if (issuedAt === null || (Date.now() - issuedAt) >= this.getTokenTimeoutMs()) {
      this.handleSessionExpiration();
    }
  }

  private scheduleExpirationTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    const issuedAt = this.getIssuedAtFromStorage();
    if (issuedAt === null) {
      this.handleSessionExpiration();
      return;
    }

    const remainingMs = this.getTokenTimeoutMs() - (Date.now() - issuedAt);

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
}
