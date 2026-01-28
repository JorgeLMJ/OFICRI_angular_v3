// src/app/components/dashboard/home/home.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { EmpleadoService } from '../../../services/Empleado.service';
import { DocumentoService } from '../../../services/documento.service';
import { DosajeService } from '../../../services/dosaje.service';
import { AsignacionToxicologiaService } from '../../../services/toxicologia.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  userName: string = '';
  currentRole: string = '';
  stats = {
    usuarios: 0,
    empleados: 0,
    documentos: 0,
    dosajes: 0,
    toxicologia: 0,
    asignacionesDosaje: 0,
    asignacionesToxicologia: 0,
    notificaciones: 0
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private empleadoService: EmpleadoService,
    private documentoService: DocumentoService,
    private dosajeService: DosajeService,
    private toxicologiaService: AsignacionToxicologiaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.nombre || 'Usuario';
    this.currentRole = user?.rol || '';
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    // Usuarios
    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.usuarios = data.length,
      error: (err) => console.error('Error cargando usuarios', err)
    });

    // Empleados
    this.empleadoService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.empleados = data.length,
      error: (err) => console.error('Error cargando empleados', err)
    });

    // Documentos
    this.documentoService.getDocumentos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.documentos = data.length,
      error: (err) => console.error('Error cargando documentos', err)
    });

    // Dosajes
    this.dosajeService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.dosajes = data.length,
      error: (err) => console.error('Error cargando dosajes', err)
    });

    // Toxicología
    this.toxicologiaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.toxicologia = data.length,
      error: (err) => console.error('Error cargando toxicología', err)
    });

    // Asignaciones Dosaje
    this.dosajeService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.asignacionesDosaje = data.length,
      error: (err) => console.error('Error cargando asignaciones dosaje', err)
    });

    // Asignaciones Toxicología
    this.toxicologiaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stats.asignacionesToxicologia = data.length,
      error: (err) => console.error('Error cargando asignaciones toxicología', err)
    });

    // Notificaciones
    this.notificationService.countUnreadNotifications().pipe(takeUntil(this.destroy$)).subscribe({
      next: (count) => this.stats.notificaciones = count,
      error: (err) => console.error('Error cargando notificaciones', err)
    });
  }

  refreshStats(): void {
    this.loadStats();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  hasRole(roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }

  isAdministrador(): boolean {
    return this.currentRole === 'Administrador';
  }
  getStatCards() {
  const isDocAdmin = this.isAdministrador();
  return [
    { label: 'Usuarios', value: this.stats.usuarios, icon: 'bi-people-fill', bgLight: 'bg-blue-50', textColor: 'text-blue-600', bgMain: 'bg-blue-600' },
    { label: 'Empleados', value: this.stats.empleados, icon: 'bi-person-badge-fill', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', bgMain: 'bg-emerald-600' },
    { label: 'Documentos', value: this.stats.documentos, icon: 'bi-file-earmark-text-fill', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', bgMain: 'bg-cyan-600' },
    { label: 'Notificaciones', value: this.stats.notificaciones, icon: 'bi-bell-fill', bgLight: 'bg-rose-50', textColor: 'text-rose-600', bgMain: 'bg-rose-600' },
    // Solo visibles para roles específicos si lo deseas, o todos
    { label: 'Dosajes', value: this.stats.dosajes, icon: 'bi-capsule', bgLight: 'bg-amber-50', textColor: 'text-amber-600', bgMain: 'bg-amber-600' },
    { label: 'Toxicología', value: this.stats.toxicologia, icon: 'bi-flask-fill', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600', bgMain: 'bg-indigo-600' }
  ].slice(0, isDocAdmin ? 8 : 4); // Limita las cards si no es admin
}

getQuickActions() {
  return [
    { title: 'Empleados', desc: 'Gestión de legajos y cargos', icon: 'bi-people', route: '/dashboard/empleados', roles: ['Administrador'], bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: 'Informes', desc: 'Redacción de informes periciales', icon: 'bi-file-earmark-word', route: '/dashboard/documento', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'], bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { title: 'Dosaje Etílico', desc: 'Control de muestras y resultados', icon: 'bi-journal-check', route: '/dashboard/asignaciones-dosaje', roles: ['Administrador', 'Auxiliar de Dosaje', 'Quimico Farmaceutico'], bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
    { title: 'Toxicología', desc: 'Asignaciones de laboratorio químico', icon: 'bi-beaker', route: '/dashboard/asignaciones-toxicologia', roles: ['Administrador', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'], bgLight: 'bg-rose-50', textColor: 'text-rose-600' },
    { title: 'Estadísticas', desc: 'Métricas y reportes mensuales', icon: 'bi-bar-chart-line', route: '/dashboard/reportes', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'], bgLight: 'bg-indigo-50', textColor: 'text-indigo-600' }
  ];
}
}