import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsignacionDosaje } from '../../../models/dosaje.model';
import { DosajeService } from '../../../services/dosaje.service';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

declare const DocsAPI: any;

@Component({
  selector: 'app-asignacion-dosaje-registro',
  templateUrl: './asignacion-dosaje-registro.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class AsignacionDosajeRegistroComponent implements OnInit, OnDestroy {
  asignacionForm!: FormGroup;
  editMode = false;
  currentUserRole: string = '';

  // Variables para Documentos
  documentos: Documento[] = [];
  documentosFiltrados: Documento[] = [];
  terminoBusqueda: string = '';
  documentoSeleccionadoOficio: string = '';
  documentosAsignados: number[] = [];

  // Paginación Documentos Modal
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Variables para Empleados
  empleados: EmpleadoDTO[] = [];
  empleadosFiltrados: EmpleadoDTO[] = [];
  terminoBusquedaEmpleado: string = '';
  empleadoSeleccionadoNombre: string = '';

  // Variables OnlyOffice
  docEditor: any = null;
  hayDocumentoCargado: boolean = false;
  cargandoVisor: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dosajeService: DosajeService,
    private documentoService: DocumentoService,
    private empleadoService: EmpleadoService,
    private authService: AuthService
  ) {}

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';

    // Inicializar Formulario
    this.asignacionForm = this.fb.group({
      id: [null],
      area: ['Laboratorio de Dosaje'],
      cualitativo: [''],
      estado: ['EN_PROCESO', Validators.required], // Valor por defecto
      documentoId: [null, Validators.required],
      empleadoId: [null, Validators.required]
    });
  
    this.gestionarPermisosCampos();
    this.cargarListas();  

    // Detectar Modo Edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.editMode = true;
        this.dosajeService.obtenerPorId(id).subscribe((asignacion: AsignacionDosaje) => {
          this.asignacionForm.patchValue({
            id: asignacion.id,
            area: asignacion.area,
            cualitativo: asignacion.cualitativo,
            estado: asignacion.estado,
            documentoId: asignacion.documentoId,
            empleadoId: asignacion.empleadoId
          }, { emitEvent: false });

          if (asignacion.documentoId) {
            this.documentoService.getDocumentoById(asignacion.documentoId).subscribe({
              next: (doc: Documento) => {
                this.documentoSeleccionadoOficio = doc.nombreOficio || 'Sin nombre de oficio';
                this.cargarVisor(doc.id!);
              }
            });
          }

          if (asignacion.empleadoId) {
            this.empleadoService.getById(asignacion.empleadoId).subscribe({
              next: (emp: EmpleadoDTO) => {
                this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
              }
            });
          }
        });
      }
    });
  }

  gestionarPermisosCampos() {
    const controlCuantitativo = this.asignacionForm.get('cualitativo');
    
    if (this.puedeEditarResultadoCuantitativo()) {
        controlCuantitativo?.enable(); // Desbloquea para Químico y Admin
    } else {
        controlCuantitativo?.disable(); // Bloquea para Auxiliar Dosaje y otros
    }
}
  cargarListas() {
    this.documentoService.getDocumentos().subscribe({
        next: (data) => {
            this.documentos = data;
            this.documentosFiltrados = [...this.documentos];
        }
    });

    this.empleadoService.getAll().subscribe({
        next: (data) => {
            this.empleados = data.filter(emp =>
                emp.cargo.toLowerCase().includes('químico farmacéutico') ||
                emp.cargo.toLowerCase().includes('quimico farmaceutico')
            );
            this.empleadosFiltrados = [...this.empleados];
        }
    });

    this.dosajeService.listar().subscribe({
        next: (asignaciones) => {
            this.documentosAsignados = asignaciones
                .filter(a => a.documentoId !== null)
                .map(a => a.documentoId!);
            
            // Si estamos editando, permitimos ver el documento actual en la lista
            if (this.editMode) {
                const currentDocId = this.asignacionForm.get('documentoId')?.value;
                if (currentDocId) {
                    this.documentosAsignados = this.documentosAsignados.filter(id => id !== currentDocId);
                }
            }
        }
    });
  }

  cargarVisor(documentoId: number) {
    if (this.docEditor) {
        this.docEditor.destroyEditor();
        this.docEditor = null;
    }
    
    this.hayDocumentoCargado = true;
    this.cargandoVisor = true;

    this.documentoService.getEditorConfig(documentoId, 'view').subscribe({
        next: (config: any) => {
            if (config.editorConfig) {
                config.editorConfig.mode = 'view';
                config.editorConfig.customization = {
                    ...config.editorConfig.customization,
                    compactHeader: true,
                    toolbar: false,
                    autosave: false,
                    forcesave: false,
                    uiTheme: 'theme-classic-light',
                };
                config.type = 'desktop';
                config.width = "100%";
                config.height = "100%";
            }

            setTimeout(() => {
                if (typeof DocsAPI !== 'undefined') {
                    this.docEditor = new DocsAPI.DocEditor("visor-dosaje", config);
                    this.cargandoVisor = false;
                }
            }, 100);
        },
        error: (err) => {
            console.error('Error cargando config visor', err);
            this.cargandoVisor = false;
            this.hayDocumentoCargado = false;
        }
    });
  }

  // Lógica Paginación Modal
  get documentosPaginados(): Documento[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.documentosFiltrados.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.documentosFiltrados.length / this.itemsPerPage) || 1;
  }

  cambiarPagina(delta: number): void {
    const nextPage = this.currentPage + delta;
    if (nextPage >= 1 && nextPage <= this.totalPages) {
      this.currentPage = nextPage;
    }
  }

  filtrarDocumentos(): void {
    const term = this.terminoBusqueda.toLowerCase().trim();
    this.documentosFiltrados = this.documentos.filter(doc =>
      (doc.nombreOficio?.toLowerCase().includes(term) || false) ||
      (doc.nombreDocumento?.toLowerCase().includes(term) || false) ||
      (doc.procedencia?.toLowerCase().includes(term) || false) ||
      (doc.nombresyapellidos?.toLowerCase().includes(term) || false) ||
      (doc.dni?.includes(term) || false)
    );
    this.currentPage = 1;
  }

  isDocumentoAsignado(documentoId: number): boolean {
    return this.documentosAsignados.includes(documentoId);
  }

  puedeSeleccionarEntidades(): boolean {
    // Si no es químico farmacéutico, puede seleccionar (admin o auxiliar)
    return this.currentUserRole !== 'Quimico Farmaceutico';
  }

  filtrarEmpleados(): void {
    const term = this.terminoBusquedaEmpleado.toLowerCase().trim();
    this.empleadosFiltrados = this.empleados.filter(emp =>
      emp.nombre.toLowerCase().includes(term) ||
      emp.apellido.toLowerCase().includes(term) ||
      emp.dni.includes(term)
    );
  }

  seleccionarDocumento(documento: Documento): void {
    if (!this.puedeSeleccionarEntidades() || this.isDocumentoAsignado(documento.id!)) return;
    this.asignacionForm.patchValue({ documentoId: documento.id });
    this.documentoSeleccionadoOficio = documento.nombreOficio || 'Sin nombre de oficio';
    this.cargarVisor(documento.id!);
  }

  seleccionarEmpleado(empleado: EmpleadoDTO): void {
    if (!this.puedeSeleccionarEntidades()) return;
    this.asignacionForm.patchValue({ empleadoId: empleado.id });
    this.empleadoSeleccionadoNombre = `${empleado.nombre} ${empleado.apellido}`;
  }

  puedeEditarResultadoCuantitativo(): boolean {
    return ['Quimico Farmaceutico', 'Auxiliar de Toxicologia', 'Administrador'].includes(this.currentUserRole);
  }

  puedeEditarEstadoCampo(): boolean {
    return ['Administrador', 'Auxiliar de Dosaje', 'Quimico Farmaceutico'].includes(this.currentUserRole);
  }

  onSubmit(): void {
    if (this.asignacionForm.valid) {
      const formValue = this.asignacionForm.getRawValue();
      const currentUser = this.authService.getCurrentUser();
      
      const dto = {
        ...formValue,
        emisorId: currentUser?.empleadoId
      };

      // 1. Guardamos la Asignación
      const req$ = this.editMode && dto.id
        ? this.dosajeService.actualizar(dto.id, dto)
        : this.dosajeService.crear(dto);

      req$.subscribe({
        next: (savedAsignacion) => {
          const documentoId = formValue.documentoId;
          const valorCuantitativo = formValue.cualitativo;

          // 2. Actualizar el Word si existe valor cuantitativo
          if (documentoId && valorCuantitativo !== null && valorCuantitativo !== '') {
            this.documentoService.actualizarTagWord(documentoId, 'CUANTITATIVO', valorCuantitativo.toString())
              .subscribe({
                next: () => {
                  this.finalizarYRedirigir('Registro y documento actualizados correctamente');
                },
                error: (err) => {
                  console.error('❌ Error Word:', err);
                  this.finalizarYRedirigir('Se guardó el registro, pero el Word no pudo actualizarse', 'warning');
                }
              });
          } else {
            this.finalizarYRedirigir('Registro guardado correctamente');
          }
        },
        error: (err: any) => {
          Swal.fire('Error', 'No se pudo guardar en la base de datos.', 'error');
        }
      });
    }
  }
  private finalizarYRedirigir(mensaje: string, icono: 'success' | 'warning' = 'success') {
    this.Toast.fire({
      icon: icono,
      title: mensaje
    });

    // Redirección inmediata a la lista de asignaciones
    this.router.navigate(['/dashboard/asignaciones-dosaje']);
  }

// 3. NUEVO MÉTODO: Para limpiar y volver a cargar el visor sin salir de la página
refrescarVistaDespuesDeGuardar(documentoId: number) {
  // Destruimos el editor actual para forzar la carga de la nueva versión del archivo
  if (this.docEditor) {
    this.docEditor.destroyEditor();
    this.docEditor = null;
  }
  
  // Pequeño delay para asegurar que el servidor procesó el archivo antes de pedirlo de nuevo
  setTimeout(() => {
    this.cargarVisor(documentoId);
  }, 500);
}

  cancelar(): void {
    this.router.navigate(['/dashboard/asignaciones-dosaje']);
  }

  ngOnDestroy(): void {
      if (this.docEditor) {
          try {
            this.docEditor.destroyEditor();
          } catch(e) { console.warn(e); }
          this.docEditor = null;
      }
  }
  
}