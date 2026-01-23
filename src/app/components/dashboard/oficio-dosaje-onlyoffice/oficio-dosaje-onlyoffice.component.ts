import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
// 👇 CORRECCIÓN 1: Ajustamos la ruta (agregamos ../ para subir un nivel más)
import { DocumentoService } from '../../../services/documento.service';
import Swal from 'sweetalert2';

declare const DocsAPI: any;

@Component({
  selector: 'app-oficio-dosaje-onlyoffice',
  // 👇 Asegúrate que el archivo HTML tenga EXACTAMENTE este nombre
  templateUrl: './oficio-dosaje-onlyoffice.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class OficioDosajeOnlyofficeComponent implements OnInit, OnDestroy {

  docEditor: any = null;
  documentoId: number | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentoId = +id;
        this.iniciarEditor(this.documentoId);
      } else {
        this.regresar();
      }
    });
  }

  iniciarEditor(id: number) {
    this.isLoading = true;

    this.documentoService.getEditorConfig(id, 'edit').subscribe({
      next: (config: any) => {
        
        if (config.editorConfig) {
          config.width = '100%';
          config.height = '100%';
          config.editorConfig.customization = {
            ...config.editorConfig.customization,
            compactHeader: false,
            toolbar: true,
            autosave: false,
            forcesave: true,
            uiTheme: 'theme-classic-light',
          };
        }

        setTimeout(() => {
          if (typeof DocsAPI !== 'undefined') {
            this.docEditor = new DocsAPI.DocEditor("onlyoffice-container", config);
            this.isLoading = false;
          } else {
            console.error('La API de OnlyOffice no está cargada.');
            Swal.fire('Error', 'No se pudo cargar el editor.', 'error');
          }
        }, 100);
      },
      // 👇 CORRECCIÓN 3: Agregamos el tipo ': any' al error
      error: (err: any) => {
        console.error('Error obteniendo config:', err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudo abrir el documento.', 'error').then(() => {
          this.regresar();
        });
      }
    });
  }

  regresar() {
    this.router.navigate(['/dashboard/oficio-dosaje']);
  }

  ngOnDestroy() {
    if (this.docEditor) {
      try {
        this.docEditor.destroyEditor();
      } catch (e) {
        console.warn('Error al destruir editor:', e);
      }
      this.docEditor = null;
    }
  }
}