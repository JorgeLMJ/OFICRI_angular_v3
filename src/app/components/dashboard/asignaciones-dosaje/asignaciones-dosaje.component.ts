// src/app/components/dashboard/asignaciones-dosaje/asignaciones-dosaje.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core'; // 👈 Agregado hooks
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsignacionDosaje } from '../../../models/dosaje.model';
import { DosajeService } from '../../../services/dosaje.service';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';


@Component({
  selector: 'app-asignaciones-dosaje',
  templateUrl: './asignaciones-dosaje.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule] 
})
export class AsignacionesDosajeComponent implements OnInit, AfterViewInit, OnDestroy {
  asignaciones: AsignacionDosaje[] = [];
  searchTerm = '';
  asignacionesFiltradas: AsignacionDosaje[] = [];
  currentUserRole: string = '';

  // 📄 Paginación
  currentPage = 1;
  pageSize = 6;
  maxVisiblePages = 5;

  // ✅ Mapa de empleados
  empleadosMap: Map<number, EmpleadoDTO> = new Map();

  // 👇 NUEVO: Propiedades para el modal de PDF
  @ViewChild('pdfModal') pdfModalEl!: ElementRef;
  private modalInstance: bootstrap.Modal | null = null;
  currentPdfUrl: string | null = null;
  pdfModalTitle = 'Vista Previa del Informe';

  constructor(
    private dosajeService: DosajeService,
    private empleadoService: EmpleadoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';
    this.loadAsignaciones();
    this.cargarEmpleados();
  }

  // 👇 NUEVO: ngAfterViewInit y ngOnDestroy
  ngAfterViewInit(): void {
    if (this.pdfModalEl) {
      this.modalInstance = new bootstrap.Modal(this.pdfModalEl.nativeElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
    }
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  get esQuimicoFarmaceutico(): boolean {
    return this.currentUserRole === 'Quimico Farmaceutico';
  }

  loadAsignaciones(): void {
    this.dosajeService.listar().subscribe({
      next: (data: AsignacionDosaje[]) => {
        this.asignaciones = data.sort((a, b) => 
          (b.id || 0) - (a.id || 0)
        );
        this.applyFilter();
        this.goToPage(1);
      },
      error: (err: any) => {
        console.error('Error cargando asignaciones', err);
        Swal.fire('❌ Error', 'No se pudieron cargar las asignaciones', 'error');
      }
    });
  }

  private cargarEmpleados(): void {
    this.empleadoService.getAll().subscribe({
      next: (empleados: EmpleadoDTO[]) => {
        empleados.forEach(emp => {
          if (emp.id) {
            this.empleadosMap.set(emp.id, emp);
          }
        });
      },
      error: (err: any) => {
        console.error('Error al cargar empleados', err);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.asignacionesFiltradas = [...this.asignaciones];
    } else {
      this.asignacionesFiltradas = this.asignaciones.filter(asignacion =>
        asignacion.area.toLowerCase().includes(term) ||
        asignacion.estado.toLowerCase().includes(term) ||
        asignacion.cualitativo?.toLowerCase().includes(term)
      );
    }
    this.goToPage(1);
  }

  nuevaAsignacion(): void {
    this.router.navigate(['/dashboard/asignacion-dosaje-registro']);
  }

  editarAsignacion(id: number): void {
    this.router.navigate(['/dashboard/asignacion-dosaje-registro', id]);
  }



  private getAnexosSeleccionados(anexos: any): string[] {
    if (!anexos) {
      return [];
    }
    const seleccionados = [];
    if (anexos.cadenaCustodia) seleccionados.push('Cadena de Custodia');
    if (anexos.rotulo) seleccionados.push('Rotulo');
    if (anexos.actaTomaMuestra) seleccionados.push('Acta de Toma de Muestra');
    if (anexos.actaConsentimiento) seleccionados.push('Acta de Consentimiento');
    if (anexos.actaDenunciaVerbal) seleccionados.push('Acta de Denuncia Verbal');
    if (anexos.actaIntervencionPolicial) seleccionados.push('Acta de Intervención Policial');
    if (anexos.copiaDniSidpol) seleccionados.push('Copia de DNI, SIDPOL');
    if (anexos.actaObtencionMuestra) seleccionados.push('Acta de Muestra de Sangre');
    return seleccionados;
  }

  // 📄 MÉTODOS DE PAGINACIÓN
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.asignacionesFiltradas.length / this.pageSize));
  }

  get paginatedAsignaciones(): AsignacionDosaje[] {
    const start = (this.currentPage -  1) * this.pageSize;
    return this.asignacionesFiltradas.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
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

  // 👇 NUEVO: Método para convertir imagen a base64
  private async imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}