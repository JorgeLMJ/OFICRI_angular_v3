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

      // 1. Guardamos la Asignación en la Base de Datos (SQL)
      const req$ = this.editMode && dto.id
        ? this.dosajeService.actualizar(dto.id, dto)
        : this.dosajeService.crear(dto);

      req$.subscribe({
        next: (savedAsignacion) => {
          console.log('✅ Asignación guardada en BD');

          // 2. LÓGICA PARA ACTUALIZAR EL WORD
          // Obtenemos el ID del documento y el valor que escribió el usuario
          const documentoId = formValue.documentoId;
          const valorCuantitativo = formValue.cualitativo; // Ojo: tu formControl se llama 'cualitativo'

          // Solo intentamos actualizar el Word si hay un documento y un valor numérico ingresado
          if (documentoId && valorCuantitativo !== null && valorCuantitativo !== '') {
            
            console.log(`📝 Actualizando Tag 'CUANTITATIVO' en Word ID: ${documentoId} con valor: ${valorCuantitativo}`);

            this.documentoService.actualizarTagWord(documentoId, 'CUANTITATIVO', valorCuantitativo.toString())
              .subscribe({
                next: () => {
                  console.log('✅ Word actualizado correctamente.');
                  // Navegamos una vez que todo terminó
                  this.router.navigate(['/dashboard/asignaciones-dosaje']);
                },
                error: (err) => {
                  console.error('❌ Error al actualizar el Word:', err);
                  // Navegamos igual, pero podrías mostrar una alerta si prefieres
                  alert('La asignación se guardó, pero hubo un error actualizando el archivo Word.');
                  this.router.navigate(['/dashboard/asignaciones-dosaje']);
                }
              });

          } else {
            // Si no había valor para actualizar en el Word, simplemente navegamos
            this.router.navigate(['/dashboard/asignaciones-dosaje']);
          }
        },
        error: (err: any) => {
          console.error('Error guardando asignación', err);
          alert('❌ Error al guardar la asignación en la base de datos.');
        }
      });
    }
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