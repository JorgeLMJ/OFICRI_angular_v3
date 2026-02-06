import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RegistroComponent } from './components/registro/registro.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { HomeComponent } from './components/dashboard/home/home.component';
import { EmpleadosComponent } from './components/dashboard/empleados/empleados.component';
import { UsuariosComponent } from './components/dashboard/usuarios/usuarios.component'; 
import { DocumentoComponent } from './components/dashboard/documento/documento.component';
import { AsignacionesDosajeComponent } from './components/dashboard/asignaciones-dosaje/asignaciones-dosaje.component';
import { AsignacionDosajeRegistroComponent } from './components/dashboard/asignacion-dosaje-registro/asignacion-dosaje-registro.component';
import { AsignacionesToxicologiaComponent } from './components/dashboard/asignaciones-toxicologia/asignaciones-toxicologia.component';
import { AsignacionToxicologiaRegistroComponent } from './components/dashboard/asignacion-toxicologia-registro/asignacion-toxicologia-registro.component';
import { OficioDosajeComponent } from './components/dashboard/oficio-dosaje/oficio-dosaje.component';
import { OficioDosajeRegistroComponent } from './components/dashboard/oficio-dosaje-registro/oficio-dosaje-registro.component';
import { OficioToxicologiaComponent } from './components/dashboard/oficio-toxicologia/oficio-toxicologia.component';
import { OficioToxicologiaRegistroComponent } from './components/dashboard/oficio-toxicologia-registro/oficio-toxicologia-registro.component';
import { ReportesComponent } from './components/dashboard/reportes/reportes.component';
import { OnlyofficeEditorComponent } from './components/dashboard/onlyoffice-editor/onlyoffice-editor.component';
import { OficioDosajeOnlyofficeComponent } from './components/dashboard/oficio-dosaje-onlyoffice/oficio-dosaje-onlyoffice.component';
import { OficioToxicologiaOnlyofficeComponent } from './components/dashboard/oficio-toxicologia-onlyoffice/oficio-toxicologia-onlyoffice.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      
      // 👑 SÓLO ADMINISTRADOR
      { path: 'usuarios', component: UsuariosComponent, data: { roles: ['Administrador'] } },   
      { path: 'empleados', component: EmpleadosComponent, data: { roles: ['Administrador'] } },
      { 
        path: 'auditoria', 
        loadComponent: () => import('./components/dashboard/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
        data: { roles: ['Administrador'] }
      },

      // 📝 INFORMES (Auxiliares y Admin)
      { 
        path: 'documento', 
        component: DocumentoComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'] } 
      },
      { 
        path: 'onlyoffice-editor/:id', 
        component: OnlyofficeEditorComponent,
        data: { roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'] } 
      },

      // 🍷 MÓDULO DOSAJE (Bloqueado para Auxiliar Toxicología y Químico)
      { 
        path: 'asignaciones-dosaje', 
        component: AsignacionesDosajeComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje', 'Quimico Farmaceutico'] } 
      },
      { 
        path: 'asignacion-dosaje-registro', 
        component: AsignacionDosajeRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje'] } 
      },
      { 
        path: 'asignacion-dosaje-registro/:id', 
        component: AsignacionDosajeRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje', 'Quimico Farmaceutico'] } 
      },
      { 
        path: 'oficio-dosaje', 
        component: OficioDosajeComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje'] } 
      },
      { 
        path: 'oficio-dosaje-registro', 
        component: OficioDosajeRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje'] } 
      },
      { 
        path: 'oficio-dosaje-registro/:id', 
        component: OficioDosajeRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje'] } 
      },
      { 
        path: 'oficio-dosaje-onlyoffice/:id', 
        component: OficioDosajeOnlyofficeComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Dosaje'] } 
      },
      // 🧪 MÓDULO TOXICOLOGÍA (Bloqueado para Auxiliar Dosaje y Químico)
      { 
        path: 'asignaciones-toxicologia', 
        component: AsignacionesToxicologiaComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'] } 
      },
      { 
        path: 'asignacion-toxicologia-registro', 
        component: AsignacionToxicologiaRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia'] } 
      },
      { 
        path: 'asignacion-toxicologia-registro/:id', 
        component: AsignacionToxicologiaRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'] } 
      },
      { 
        path: 'oficio-toxicologia', 
        component: OficioToxicologiaComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia'] } 
      },
      { 
        path: 'oficio-toxicologia-registro', 
        component: OficioToxicologiaRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia'] } 
      },
      { 
        path: 'oficio-toxicologia-registro/:id', 
        component: OficioToxicologiaRegistroComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia'] } 
      },
      { 
        path: 'oficio-toxicologia-onlyoffice/:id', 
        component: OficioToxicologiaOnlyofficeComponent, 
        data: { roles: ['Administrador', 'Auxiliar de Toxicologia'] } 
      },

      // 📊 REPORTES Y NOTIFICACIONES
      { path: 'reportes', component: ReportesComponent, data: { roles: ['Administrador', 'Quimico Farmaceutico'] } },
      { 
        path: 'notificaciones', 
        loadComponent: () => import('./components/dashboard/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent),
        data: { roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'] }
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];