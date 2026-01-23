import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OficioDosaje } from '../../../models/oficio-dosaje.model';
import { OficioDosajeService } from '../../../services/oficio-dosaje.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

@Component({
  selector: 'app-oficio-dosaje',
  templateUrl: './oficio-dosaje.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe]
})
export class OficioDosajeComponent implements OnInit, AfterViewInit, OnDestroy {
  oficios: OficioDosaje[] = [];
  searchTerm = '';

  // Paginación
  currentPage = 1;
  pageSize = 6;
  maxVisiblePages = 5;

  @ViewChild('pdfModal') pdfModalEl!: ElementRef;
  private modalInstance: bootstrap.Modal | null = null;
  currentPdfUrl: string | null = null;
  pdfModalTitle = 'Vista Previa del Oficio';

  constructor(
    private oficioDosajeService: OficioDosajeService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOficios();
  }

  ngAfterViewInit(): void {
    if (this.pdfModalEl) {
      this.modalInstance = new bootstrap.Modal(this.pdfModalEl.nativeElement, {
        backdrop: true, keyboard: true, focus: true
      });
    }
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  nuevoOficio(): void {
    this.router.navigate(['/dashboard/oficio-dosaje-registro']);
  }

  editarOficio(id: number): void {
    this.router.navigate(['/dashboard/oficio-dosaje-registro', id]);
  }

  // 👇 MÉTODO DE REDIRECCIÓN A LA URL SOLICITADA 👇
  abrirOnlyOffice(documentoId: number): void {
    if (documentoId) {
      // Navega a: http://localhost:4200/dashboard/oficio-dosaje-onlyoffice/ID
      this.router.navigate(['/dashboard/oficio-dosaje-onlyoffice', documentoId]);
    } else {
      Swal.fire('Atención', 'Este oficio no tiene un documento base asociado.', 'warning');
    }
  }
  // 👆 FIN DEL MÉTODO 👆

  eliminarOficio(id: number): void {
      Swal.fire({
          title: '¿Estás seguro?',
          text: "Esta acción no se puede deshacer.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar'
      }).then((result) => {
          if (result.isConfirmed) {
              this.oficioDosajeService.eliminar(id).subscribe({
                  next: () => {
                      this.oficios = this.oficios.filter(o => o.id !== id);
                      Swal.fire('Eliminado', 'El oficio ha sido eliminado.', 'success');
                  },
                  error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
              });
          }
      });
  }

  loadOficios(): void {
    this.oficioDosajeService.listar().subscribe({
      next: (data) => {
        this.oficios = (data ?? []).sort((a, b) => (b.id || 0) - (a.id || 0));
        this.goToPage(1);
      },
      error: (err) => {
        console.error('Error cargando oficios', err);
        Swal.fire('❌ Error', 'No se pudieron cargar los oficios', 'error');
      }
    });
  }

  get filteredOficios(): OficioDosaje[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return [...this.oficios];
    return this.oficios.filter(oficio =>
      (oficio.nro_oficio?.toLowerCase().includes(q)) ||
      (oficio.nro_informe?.toLowerCase().includes(q)) ||
      (oficio.referencia?.toLowerCase().includes(q))
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOficios.length / this.pageSize));
  }

  get paginatedOficios(): OficioDosaje[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOficios.slice(start, start + this.pageSize);
  }

  goToPage(p: number): void {
    this.currentPage = Math.min(Math.max(1, p), this.totalPages);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const half = Math.floor(this.maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);
    if (end - start + 1 < this.maxVisiblePages) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByPage(_: number, page: number): number {
    return page;
  }
  
  trackById(_: number, item: OficioDosaje): number {
      return item.id!;
  }
}