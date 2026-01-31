import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { DocumentoService } from '../../services/documento.service';
import { LayoutService } from '../../services/layout.service';

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  isMenuOpen = true;
  isMobileMenuOpen = false;
  isDarkMode = false;
  userName: string = '';
  currentRole: string = '';
  currentPage = 'Panel de Control';
  innerWidth = window.innerWidth;

  // 👇 VARIABLE DE CONTROL PARA EL HEADER
  isHeaderVisible = true; 

  menuItems = [
    { title: 'Inicio', icon: 'bi-house-door', route: '/dashboard', roles: ['Administrador'] },
    { title: 'Usuarios', icon: 'bi-person-gear', route: '/dashboard/usuarios', roles: ['Administrador'] },
    { title: 'Empleados', icon: 'bi-people', route: '/dashboard/empleados', roles: ['Administrador'] },
    { title: 'Informe', icon: 'bi-file-earmark-text', route: '/dashboard/documento', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'] },
    { title: 'Asignaciones Dosaje', icon: 'bi-journal-text', route: '/dashboard/asignaciones-dosaje', roles: ['Administrador', 'Auxiliar de Dosaje','Quimico Farmaceutico'] },
    { title: 'Asignaciones Toxicología', icon: 'bi-beaker', route: '/dashboard/asignaciones-toxicologia', roles: ['Administrador', 'Auxiliar de Toxicologia','Quimico Farmaceutico'] },  
    { title: 'Oficio Dosaje', icon: 'bi-file-earmark-medical', route: '/dashboard/oficio-dosaje', roles: ['Administrador', 'Auxiliar de Dosaje'] },
    { title: 'Oficio Toxicologia', icon: 'bi-file-earmark-medical', route: '/dashboard/oficio-toxicologia', roles: ['Administrador', 'Auxiliar de Toxicologia'] },     
    { title: 'Notificaciones', icon: 'bi-bell', route: '/dashboard/notificaciones', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia', 'Quimico Farmaceutico'] },
    { title: 'Reportes', icon: 'bi-bar-chart', route: '/dashboard/reportes', roles: ['Administrador', 'Quimico Farmaceutico'] },
    { title: 'Auditoría', icon: 'bi-journal-bookmark', route: '/dashboard/auditoria', roles: ['Administrador'] },
  ];
  
  filteredMenuItems: any[] = [];
  unreadCount = 0;

  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private documentoService: DocumentoService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.nombre || 'Usuario';
    this.currentRole = user?.rol || '';

    this.filteredMenuItems = this.menuItems.filter(item =>
      item.roles.includes(this.currentRole)
    );

    // Suscripción al estado del menú lateral
    this.layoutService.isMenuOpen$.subscribe(isOpen => {
      this.isMenuOpen = isOpen;
    });

    // 👇 SUSCRIPCIÓN NUEVA: Escuchar visibilidad del Header
    this.layoutService.headerVisible$.subscribe(visible => {
      // Usamos setTimeout para evitar error ExpressionChangedAfterItHasBeenChecked
      setTimeout(() => {
        this.isHeaderVisible = visible;
      });
    });

    this.loadUnreadCount();

    this.refreshInterval = setInterval(() => {
      this.loadUnreadCount();
    }, 30000);

    // Escucha cambios de ruta para cerrar el offcanvas en móvil
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.innerWidth < 992 && this.isMobileMenuOpen) {
        const offcanvasElement = document.getElementById('offcanvasMenu');
        if (offcanvasElement) {
          const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
          if (offcanvas) {
            offcanvas.hide();
          }
        }
        this.isMobileMenuOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadUnreadCount(): void {
    this.notificationService.countUnreadNotifications().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (err: unknown) => console.error('Error cargando contador de notificaciones', err)
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.innerWidth = event.target.innerWidth;
    if (this.innerWidth >= 992) {
      this.isMenuOpen = true;
      this.isMobileMenuOpen = false;
    }
  }

  toggleMenu(): void {
    if (this.innerWidth < 992) {
      const offcanvasElement = document.getElementById('offcanvasMenu');
      if (offcanvasElement) {
        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
        if (this.isMobileMenuOpen) offcanvas.hide();
        else offcanvas.show();
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
      }
    } else {
      this.layoutService.toggleMenu();
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('bg-dark', this.isDarkMode);
    document.body.classList.toggle('text-white', this.isDarkMode);
  }

  getCurrentPageTitle(): string {
    const currentRoute = this.router.url;
    const menuItem = this.filteredMenuItems.find(item => currentRoute.startsWith(item.route));
    return menuItem ? menuItem.title : 'Panel de Control';
  }

  logout(): void {
    const offcanvasElement = document.getElementById('offcanvasMenu');
    if (offcanvasElement) {
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (offcanvas) {
        offcanvas.hide();
      }
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  nuevoDocumento(): void {
    this.documentoService.crearNuevoDocumentoVacio().subscribe({
      next: (nuevoId) => {
        console.log('📄 Nuevo documento creado con ID:', nuevoId);
        this.router.navigate(['/dashboard/onlyoffice-editor', nuevoId]);
      },
      error: (err) => {
        console.error('❌ Error al crear nuevo documento:', err);
        alert('No se pudo crear el documento. Intente nuevamente.');
      }
    });
  }
}