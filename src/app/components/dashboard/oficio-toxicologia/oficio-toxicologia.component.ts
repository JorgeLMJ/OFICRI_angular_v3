import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OficioToxicologia} from '../../../models/oficio-toxicologia.model';
import { OficioToxicologiaService } from '../../../services/oficio-toxicologia.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-oficio-toxicologia',
  templateUrl: './oficio-toxicologia.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OficioToxicologiaComponent implements OnInit, OnDestroy {
  oficios: OficioToxicologia[] = [];
  searchTerm = '';
  currentUserRole: string = '';
  // Paginación
  currentPage = 1;
  pageSize = 6;

  // 🕒 Lógica de Sincronización (Igual a Documentos)
  updatingId: number | null = null;
  countdown: number = 0;

  constructor(
    private oficioToxicologiaService: OficioToxicologiaService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';
    this.loadOficios();
    this.route.queryParams.subscribe(params => {
      const id = params['updatedId'];
      if (id) {
        this.iniciarContadorActualizacion(Number(id));
      }
    });
  }

  iniciarContadorActualizacion(id: number) {
    this.updatingId = id;
    this.countdown = 7; // Mismo tiempo que Documentos

    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(interval);
        this.updatingId = null; 
        this.loadOficios();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {}
        });
      }
    }, 1000); 
  }

  loadOficios(): void {
    this.oficioToxicologiaService.getOficiosToxicologia().subscribe({
      next: (data) => {
        this.oficios = (data ?? []).sort((a, b) => (b.id || 0) - (a.id || 0));
      },
      error: (err) => console.error('Error cargando oficios', err)
    });
  }

  abrirOnlyOffice(oficioId: number): void {
  Swal.fire({
    title: 'Preparando documento...',
    text: 'Reemplazando textos predeterminados en el Word.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  // 1. Pedimos al servidor que busque "{{FECHA}}", etc., y ponga los datos de la card
  this.oficioToxicologiaService.sincronizarDatos(oficioId).subscribe({
    next: () => {
      Swal.close();
      // 2. Ahora abrimos el editor con el archivo ya modificado
      this.router.navigate(['/dashboard/oficio-toxicologia-onlyoffice', oficioId]);
    },
    error: (err) => {
      Swal.fire('Error', 'No se pudo procesar el reemplazo de texto', 'error');
    }
  });
}
  // --- MÉTODOS DE APOYO ---
  nuevoOficio() { this.router.navigate(['/dashboard/oficio-toxicologia-registro']); }
  editarOficio(id: number) { this.router.navigate(['/dashboard/oficio-toxicologia-registro', id]); }
  
  eliminarOficio(id: number) {
    Swal.fire({
      title: '¿Eliminar oficio?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.oficioToxicologiaService.deleteOficioToxicologia(id).subscribe(() => {
          this.oficios = this.oficios.filter(o => o.id !== id);
          Swal.fire('Eliminado', '', 'success');
        });
      }
    });
  }

  // Paginación simple
  get filteredOficios() {
    const q = this.searchTerm.toLowerCase();
    return this.oficios.filter(o => o.nro_oficio?.toLowerCase().includes(q));
  }
  get totalPages() { return Math.ceil(this.filteredOficios.length / this.pageSize); }
  get paginatedOficios() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOficios.slice(start, start + this.pageSize);
  }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  goToPage(p: number) { this.currentPage = p; }
  getPageNumbers() { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }
  trackById(index: number, item: OficioToxicologia) { return item.id!; }
  ngOnDestroy(): void {}
}