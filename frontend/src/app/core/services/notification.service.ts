import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  icon: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();
  private readonly url = `${environment.apiUrl}/notifications`;

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<{ data: NotificationItem[] }>(this.url).pipe(map((response) => response.data));
  }

  notifyDataChanged(): void {
    this.refreshSubject.next();
  }
}