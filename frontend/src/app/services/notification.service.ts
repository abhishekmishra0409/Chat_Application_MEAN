import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();

  showSuccess(message: string): void {
    this.notificationSubject.next({ type: 'success', message });
  }

  showError(message: string): void {
    this.notificationSubject.next({ type: 'error', message });
  }

  showWarning(message: string): void {
    this.notificationSubject.next({ type: 'warning', message });
  }

  showInfo(message: string): void {
    this.notificationSubject.next({ type: 'info', message });
  }
}
