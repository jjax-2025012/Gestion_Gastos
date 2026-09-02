import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  icon: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();
  private readonly url = `${environment.apiUrl}/notifications`;
  readonly unreadCount = signal(0);

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<{ data: NotificationItem[] }>(this.url).pipe(
      map((response) => response.data),
      tap((items) => this.unreadCount.set(items.filter((item) => !item.is_read).length))
    );
  }

  markAllAsRead(): Observable<{ success: boolean; updated: number }> {
    return this.http.patch<{ success: boolean; updated: number }>(`${this.url}/read-all`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  deleteNotification(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.url}/${id}`);
  }

  notifyDataChanged(): void {
    this.refreshSubject.next();
  }
}