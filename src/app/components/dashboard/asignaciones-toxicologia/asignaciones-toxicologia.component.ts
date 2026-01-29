// src/app/components/dashboard/asignaciones-toxicologia/asignaciones-toxicologia.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core'; // 👈 Agregado ViewChild, ElementRef, etc.
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsignacionToxicologia, ToxicologiaResultado } from '../../../models/toxicologia.model';
import { AsignacionToxicologiaService } from '../../../services/toxicologia.service';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap'; // 👈 Agregado
import jsPDF from 'jspdf'; // 👈 Agregado
import html2canvas from 'html2canvas'; // 👈 Agregado
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe'; // 👈 Agregado

@Component({
  selector: 'app-asignaciones-toxicologia',
  templateUrl: './asignaciones-toxicologia.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule] // 👈 Agregado SafeUrlPipe
})
export class AsignacionesToxicologiaComponent implements OnInit, AfterViewInit, OnDestroy { // 👈 Implementa AfterViewInit, OnDestroy
  asignaciones: AsignacionToxicologia[] = [];
  asignacionesFiltradas: AsignacionToxicologia[] = [];
  searchTerm: string = '';
  empleadosMap: Map<number, EmpleadoDTO> = new Map();

  // 📄 Paginación
  currentPage = 1;
  pageSize = 6;
  maxVisiblePages = 5;

  // 👇 NUEVO: Propiedades para el modal de PDF
  @ViewChild('pdfModal') pdfModalEl!: ElementRef;
  private modalInstance: bootstrap.Modal | null = null;
  currentPdfUrl: string | null = null;
  pdfModalTitle = 'Vista Previa del Informe';

  constructor(
    private asignacionToxService: AsignacionToxicologiaService,
    private documentoService: DocumentoService,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarAsignaciones();
  }
  abrirOnlyOffice(documentoId: number): void {
    if (!documentoId) {
      Swal.fire('⚠️ Error', 'No hay un documento vinculado a esta asignación.', 'error');
      return;
    }
    this.router.navigate(['/dashboard/onlyoffice-editor', documentoId]);
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

  cargarAsignaciones(): void {
    this.asignacionToxService.listar().subscribe({
      next: (data) => {
        const currentUser = this.authService.getCurrentUser();
        const userRole = currentUser?.rol || '';
        let asignacionesFiltradas = data;
        if (userRole === 'Auxiliar de Toxicologia') {
          asignacionesFiltradas = data.filter(a =>
            a.area?.toLowerCase().includes('toxicología') ||
            a.area?.toLowerCase().includes('toxicologia')
          );
        }
        this.asignaciones = asignacionesFiltradas.sort((a, b) =>
          (b.id || 0) - (a.id || 0)
        );
        this.asignacionesFiltradas = [...this.asignaciones];
        this.goToPage(1);
        this.cargarEmpleados(asignacionesFiltradas);
      },
      error: (err) => Swal.fire('Error', 'No se pudieron cargar las asignaciones de toxicología', 'error')
    });
  }

  private cargarEmpleados(asignaciones: AsignacionToxicologia[]): void {
    const empleadoIds = [...new Set(asignaciones.map(a => a.empleadoId))].filter(id => id !== undefined) as number[];
    if (empleadoIds.length > 0) {
      this.empleadoService.getAll().subscribe({
        next: (todosEmpleados: EmpleadoDTO[]) => {
          const empleadosFiltrados = todosEmpleados.filter(emp =>
            emp.id && empleadoIds.includes(emp.id)
          );
          empleadosFiltrados.forEach(emp => {
            if (emp.id) {
              this.empleadosMap.set(emp.id, emp);
            }
          });
        },
        error: (err: any) => console.error('Error al cargar empleados:', err)
      });
    }
  }

  filtrarAsignaciones(): void {
    const term = this.searchTerm.toLowerCase();
    this.asignacionesFiltradas = this.asignaciones.filter(a =>
      a.estado.toLowerCase().includes(term) ||
      a.documentoId.toString().includes(term) ||
      a.empleadoId.toString().includes(term)
    );
    this.goToPage(1);
  }

  nuevaAsignacion(): void {
    this.router.navigate(['/dashboard/asignacion-toxicologia-registro']);
  }

  editarAsignacion(id: number): void {
    this.router.navigate(['/dashboard/asignacion-toxicologia-registro', id]);
  }

  eliminarAsignacion(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede revertir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.asignacionToxService.eliminar(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La asignación ha sido eliminada.', 'success');
            this.cargarAsignaciones();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar la asignación.', 'error')
        });
      }
    });
  }

  getResultadosArray(resultados: ToxicologiaResultado): { droga: string, resultado: string }[] {
    if (!resultados) return [];
    return Object.entries(resultados)
      .filter(([clave, valor]) => valor !== undefined && valor !== null && (valor === 'Positivo' || valor === 'Negativo'))
      .map(([clave, valor]) => ({
        droga: clave.charAt(0).toUpperCase() + clave.slice(1).replace(/([A-Z])/g, ' $1'),
        resultado: valor as string
      }));
  }

  // 📄 MÉTODOS DE PAGINACIÓN
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.asignacionesFiltradas.length / this.pageSize));
  }

  get paginatedAsignaciones(): AsignacionToxicologia[] {
    const start = (this.currentPage - 1) * this.pageSize;
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

  // 👇 NUEVO: Método para convertir imagen a base64 (igual que en documento.component.ts)
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