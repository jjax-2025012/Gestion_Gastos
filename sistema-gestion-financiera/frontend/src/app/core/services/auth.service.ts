import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, RegisterRequest, User } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  
  public currentUser = signal<User | null>(this.getUserFromStorage());
  public sessionExpiredMessage: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // Obtenedor del Token para el interceptor
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Manejador del 401 / Expiración de sesión
  handleSessionExpiration(): void {
    this.sessionExpiredMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    this.logout();
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}