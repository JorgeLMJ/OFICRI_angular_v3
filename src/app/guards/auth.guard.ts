// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate,CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate,CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.authService.getCurrentUser();
    const userRole = user?.rol;
    const allowedRoles = route.data['roles'] as Array<string>;

    // Si la ruta tiene restricciones y el rol del usuario NO está permitido
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: `El perfil de ${userRole} no tiene autorización para este módulo.`,
        confirmButtonColor: '#d33'
      });

      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }
}