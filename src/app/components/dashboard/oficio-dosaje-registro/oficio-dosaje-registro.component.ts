import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OficioDosajeService } from '../../../services/oficio-dosaje.service';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
declare const DocsAPI: any;

@Component({
  selector: 'app-oficio-dosaje-registro',
  templateUrl: './oficio-dosaje-registro.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class OficioDosajeRegistroComponent implements OnInit, OnDestroy {
  oficioForm!: FormGroup;
  editMode = false;
  
  // Datos para el Modal de Búsqueda
  documentos: Documento[] = [];
  documentosFiltrados: Documento[] = [];
  terminoBusqueda: string = '';
  documentoSeleccionadoOficio: string = '';
  
  // Variables OnlyOffice
  docEditor: any = null;
  hayDocumentoCargado = false;
  cargandoVisor = false;

  // Paginación Modal
  currentPageModal = 1;
  pageSizeModal = 5;

  documentosAsignados: number[] = []

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private oficioDosajeService: OficioDosajeService,
    private documentoService: DocumentoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarListas();
    this.checkEditMode();
    
  }

  private initForm() {
    this.oficioForm = this.fb.group({
      id: [null],
      fecha: ['', Validators.required],
      nro_oficio: ['', Validators.required],
      gradoPNP: ['', Validators.required],
      nombresyapellidosPNP: ['', Validators.required],
      nro_informe_referencia: ['', Validators.required],
      documentoId: [null, Validators.required]
    });
  }

  private cargarListas() {
    // 1. Cargamos todos los documentos
    this.documentoService.getDocumentos().subscribe(data => {
      this.documentos = data;
      this.documentosFiltrados = [...this.documentos];
    });

    // 2. Cargamos los oficios para saber cuáles documentos ya están "usados"
    this.oficioDosajeService.getOficiosDosaje().subscribe(oficios => {
      this.documentosAsignados = oficios
        .filter(o => o.documentoId !== null)
        .map(o => o.documentoId!);

      // Si estamos editando, permitimos que el documento actual aparezca como disponible
      if (this.editMode) {
        const currentDocId = this.oficioForm.get('documentoId')?.value;
        if (currentDocId) {
          this.documentosAsignados = this.documentosAsignados.filter(id => id !== currentDocId);
        }
      }
    });
  }

  // Función para verificar en el HTML
  isDocumentoAsignado(documentoId: number | undefined): boolean {
    if (!documentoId) return false;
    return this.documentosAsignados.includes(documentoId);
  }

  private checkEditMode() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.editMode = true;
        this.oficioDosajeService.getOficioDosajeById(id).subscribe(oficio => {
          this.oficioForm.patchValue(oficio);
          
          // Cargar el documento asociado en el visor si existe
          if (oficio.documentoId) {
            this.documentoService.getDocumentoById(oficio.documentoId).subscribe(doc => {
              this.documentoSeleccionadoOficio = doc.nombreOficio || doc.nombresyapellidos;
              this.cargarVisor(doc.id!);
            });
          }
        });
      }
    });
  }

  // --- LÓGICA ONLYOFFICE (Modo Vista) ---
  cargarVisor(documentoId: number) {
    if (this.docEditor) { 
        try { this.docEditor.destroyEditor(); } catch(e) {}
        this.docEditor = null;
    }
    
    this.hayDocumentoCargado = true;
    this.cargandoVisor = true;

    this.documentoService.getEditorConfig(documentoId, 'view').subscribe({
      next: (config: any) => {
        if (config.editorConfig) {
          config.editorConfig.mode = 'view'; // Forzamos modo lectura
          config.editorConfig.customization = {
            ...config.editorConfig.customization,
            compactHeader: true, 
            toolbar: false, 
            autosave: false, 
            uiTheme: 'theme-classic-light'
          };
          config.width = '100%'; 
          config.height = '100%';
          config.type = 'desktop';
        }
        
        setTimeout(() => {
          if (typeof DocsAPI !== 'undefined') {
            this.docEditor = new DocsAPI.DocEditor("editor-oficio", config);
            this.cargandoVisor = false;
          }
        }, 100);
      },
      error: () => { 
          this.cargandoVisor = false; 
          this.hayDocumentoCargado = false; 
      }
    });
  }

  // --- LÓGICA MODAL Y PAGINACIÓN ---
  get totalPagesModal() { return Math.ceil(this.documentosFiltrados.length / this.pageSizeModal); }
  
  get paginatedDocumentos() {
    const start = (this.currentPageModal - 1) * this.pageSizeModal;
    return this.documentosFiltrados.slice(start, start + this.pageSizeModal);
  }
  
  prevPageModal() { if (this.currentPageModal > 1) this.currentPageModal--; }
  nextPageModal() { if (this.currentPageModal < this.totalPagesModal) this.currentPageModal++; }

  filtrarDocumentos() {
    const term = this.terminoBusqueda.toLowerCase();
    this.documentosFiltrados = this.documentos.filter(d => 
        (d.nombreOficio?.toLowerCase().includes(term) || false) || 
        (d.nombresyapellidos?.toLowerCase().includes(term) || false) ||
        (d.dni?.includes(term) || false)
    );
    this.currentPageModal = 1;
  }

  seleccionarDocumento(doc: Documento) {
    this.oficioForm.patchValue({ documentoId: doc.id });
    
    // Auto-rellenar algunos campos si están vacíos
    if(!this.oficioForm.get('nro_informe_referencia')?.value) {
       this.oficioForm.patchValue({ nro_informe_referencia: doc.nombreOficio });
    }

    this.documentoSeleccionadoOficio = doc.nombreOficio || doc.nombresyapellidos;
    this.cargarVisor(doc.id!);
  }

  // --- ACCIONES ---
  onSubmit() {
  if (this.oficioForm.valid) {
    Swal.fire({
      title: 'Procesando...',
      text: 'Estamos guardando los datos y generando el documento Word.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const data = this.oficioForm.getRawValue();
    
    // El backend hará el trabajo pesado de POI al recibir este objeto
    const req$ = this.editMode 
      ? this.oficioDosajeService.updateOficioDosaje(data.id, data) 
      : this.oficioDosajeService.createOficioDosaje(data);
    
    req$.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: 'El oficio y su archivo Word han sido creados correctamente.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/dashboard/oficio-dosaje']);
        });
      },
      error: (e) => {
        Swal.fire('Error', 'No se pudo generar el archivo: ' + e.message, 'error');
      }
    });
  }
}

  cancelar() { 
      this.router.navigate(['/dashboard/oficio-dosaje']); 
  }

  ngOnDestroy() { 
      if (this.docEditor) { 
          try { this.docEditor.destroyEditor(); } catch(e) {}
      } 
  }

  
}