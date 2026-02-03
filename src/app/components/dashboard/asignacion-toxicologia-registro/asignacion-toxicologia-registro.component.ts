import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AsignacionToxicologia } from '../../../models/toxicologia.model';
import { AsignacionToxicologiaService } from '../../../services/toxicologia.service';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-asignacion-toxicologia-registro',
  templateUrl: './asignacion-toxicologia-registro.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class AsignacionToxicologiaRegistroComponent implements OnInit, AfterViewInit {
  asignacionForm!: FormGroup;
  editMode = false;
  currentId: number | null = null;
  currentUserRole: string = '';

  @ViewChild('documentoModal') documentoModalEl!: ElementRef;
  @ViewChild('empleadoModal') empleadoModalEl!: ElementRef;
  private documentoModal: Modal | null = null;
  private empleadoModal: Modal | null = null;

  documentos: Documento[] = [];
  documentosFiltrados: Documento[] = [];
  empleados: EmpleadoDTO[] = [];
  empleadosFiltrados: EmpleadoDTO[] = [];

  terminoBusquedaDocumento: string = '';
  documentoSeleccionadoInfo: string = '';
  empleadoSeleccionadoNombre: string = '';
  documentosAsignados: number[] = [];

  // ✅ CONFIGURACIÓN DE PAGINACIÓN SOLICITADA
  currentPageDocumentos = 1;
  pageSizeDocumentos = 5;

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private asignacionToxService: AsignacionToxicologiaService,
    private documentoService: DocumentoService,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';

    this.asignacionForm = this.fb.group({
      id: [null],
      area: ['Laboratorio de Toxicologia'],
      documentoId: [null, Validators.required],
      empleadoId: [null, Validators.required],
      estado: ['EN_PROCESO', Validators.required],
      resultados: this.fb.group({
        marihuana: [null], cocaina: [null], benzodiacepinas: [null], barbituricos: [null],
        carbamatos: [null], estricnina: [null], cumarinas: [null], organofosforados: [null],
        misoprostol: [null], piretrinas: [null]
      })
    });

    this.cargarDatosParaModales();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.editMode = true;
        this.currentId = +id;
        this.cargarAsignacionParaEditar(this.currentId);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.documentoModalEl?.nativeElement) {
      this.documentoModal = new Modal(this.documentoModalEl.nativeElement);
    }
    if (this.empleadoModalEl?.nativeElement) {
      this.empleadoModal = new Modal(this.empleadoModalEl.nativeElement);
    }
  }

  cargarDatosParaModales() {
    this.documentoService.getDocumentos().subscribe(data => {
      this.documentos = data;
      this.documentosFiltrados = [...this.documentos];
      this.aplicarFiltroYOrden();
    });

    this.empleadoService.getAll().subscribe(data => {
      this.empleados = data.filter(e => e.cargo.toLowerCase().includes('quimico'));
      this.empleadosFiltrados = this.empleados;
    });

    this.asignacionToxService.listar().subscribe(asignaciones => {
      this.documentosAsignados = asignaciones.map(a => a.documentoId!);
    });
  }

  // ✅ SOLUCIÓN AL ERROR NG9: Función de filtrado para el modal
  filtrarDocumentos(): void {
    const term = this.terminoBusquedaDocumento.toLowerCase().trim();
    this.documentosFiltrados = this.documentos.filter(doc =>
      (doc.nombreOficio?.toLowerCase().includes(term) || false) ||
      (doc.nombresyapellidos?.toLowerCase().includes(term) || false) ||
      (doc.dni?.includes(term) || false)
    );
    this.currentPageDocumentos = 1;
  }

  aplicarFiltroYOrden() {
    this.documentosFiltrados.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  // ✅ GETTERS PARA LA PAGINACIÓN DE 5 ELEMENTOS
  get paginatedDocumentos() {
    const start = (this.currentPageDocumentos - 1) * this.pageSizeDocumentos;
    return this.documentosFiltrados.slice(start, start + this.pageSizeDocumentos);
  }

  get totalPagesDocumentos() {
    return Math.max(1, Math.ceil(this.documentosFiltrados.length / this.pageSizeDocumentos));
  }

  goToPageDocumentos(page: number) {
    if (page >= 1 && page <= this.totalPagesDocumentos) {
      this.currentPageDocumentos = page;
    }
  }

  isDocumentoAsignado(documentoId: number): boolean {
    if (this.editMode && this.asignacionForm.get('documentoId')?.value === documentoId) return false;
    return this.documentosAsignados.includes(documentoId);
  }

  seleccionarDocumento(doc: Documento) {
    this.asignacionForm.patchValue({ documentoId: doc.id });
    this.documentoSeleccionadoInfo = doc.nombreOficio || doc.nombresyapellidos || 'Expediente Seleccionado';
    this.cd.detectChanges();
    this.documentoModal?.hide();
  }

  seleccionarEmpleado(emp: EmpleadoDTO) {
    this.asignacionForm.patchValue({ empleadoId: emp.id });
    this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
    this.cd.detectChanges();
    this.empleadoModal?.hide();
  }

  openDocumentoModal() { this.documentoModal?.show(); }
  openEmpleadoModal() { this.empleadoModal?.show(); }
  closeDocumentoModal() { this.documentoModal?.hide(); }
  closeEmpleadoModal() { this.empleadoModal?.hide(); }

  get puedeEditarSustancias(): boolean {
    return ['Quimico Farmaceutico', 'Administrador'].includes(this.currentUserRole);
  }

  get puedeFinalizarPericia(): boolean {
    return ['Quimico Farmaceutico', 'Administrador'].includes(this.currentUserRole);
  }

  toggleResultado(campo: string, valor: string): void {
    if (!this.puedeEditarSustancias) return;
    const control = this.asignacionForm.get(`resultados.${campo}`);
    if (control) {
      control.setValue(control.value === valor ? null : valor);
    }
  }

  onSubmit(): void {
    if (this.asignacionForm.invalid) return;
    const dto = { ...this.asignacionForm.getRawValue(), emisorId: this.authService.getCurrentUser()?.empleadoId };
    const req$ = this.editMode ? this.asignacionToxService.actualizar(this.currentId!, dto) : this.asignacionToxService.crear(dto);

    req$.subscribe({
      next: () => {
        this.Toast.fire({ icon: 'success', title: 'Pericia guardada' });
        this.router.navigate(['/dashboard/asignaciones-toxicologia']);
      },
      error: () => Swal.fire('Error', 'No se pudo guardar', 'error')
    });
  }

  cargarAsignacionParaEditar(id: number) {
    this.asignacionToxService.obtenerPorId(id).subscribe(data => {
      this.asignacionForm.patchValue(data);
      if (data.documentoId) {
        this.documentoService.getDocumentoById(data.documentoId).subscribe(doc => {
          this.documentoSeleccionadoInfo = doc.nombreOficio || doc.nombresyapellidos || '';
        });
      }
      if (data.empleadoId) {
        this.empleadoService.getById(data.empleadoId).subscribe(emp => {
          this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
        });
      }
    });
  }

  cancelar() { this.router.navigate(['/dashboard/asignaciones-toxicologia']); }
}