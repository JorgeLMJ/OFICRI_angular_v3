// src/app/components/dashboard/notificaciones/notificaciones.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notificaciones.component.html' 
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  // --- Propiedades de Paginación ---
  currentPage = 1;
  itemsPerPage = 5;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getAllNotifications().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.notifications = data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // Segmentar notificaciones para la vista actual
  get paginatedNotifications(): Notification[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.notifications.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.notifications.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          const index = this.notifications.findIndex(n => n.id === updated.id);
          if (index !== -1) {
            this.notifications[index] = updated;
          }
        },
        error: (err) => {
          console.error('Error marcando como leída', err);
        }
      });
    }
  }
}