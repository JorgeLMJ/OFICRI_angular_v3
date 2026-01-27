import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OficioDosajeService } from '../../../services/oficio-dosaje.service';
import { LayoutService } from '../../../services/layout.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

declare const DocsAPI: any;

@Component({
  selector: 'app-oficio-dosaje-onlyoffice',
  templateUrl: './oficio-dosaje-onlyoffice.component.html',
  standalone: true,
  imports: [NgIf,CommonModule]
})
export class OficioDosajeOnlyofficeComponent implements OnInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  editorConfig: any = null;
  configReceived = false;
  docEditor: any = null;    
  oficioId!: number;
  
  guardadoExitoso = false;
  cargaExitosa = false;    
  esBorradorVacio = false;
  private routeSub!: Subscription;
  private scriptCheckInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oficioDosajeService: OficioDosajeService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    // 👇 OCULTAR HEADER INMEDIATAMENTE
    setTimeout(() => {
      this.layoutService.hideHeader();
    }, 0);

    this.routeSub = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const nuevoId = Number(idParam);
        if (this.oficioId !== nuevoId) {
          this.oficioId = nuevoId;
          this.verificarEstadoInicial(nuevoId);
        }
      }
    });
  }

  verificarEstadoInicial(id: number) {
    this.oficioDosajeService.getOficioDosajeById(id).subscribe({
      next: (doc) => {
        this.esBorradorVacio = !doc.nombresyapellidosPNP ;
        this.oficioId = id;
        this.recargarEditor();
      },
      error: () => {
        this.oficioId = id;
        this.recargarEditor();
      }
    });
  }

  recargarEditor() {
      if (this.docEditor) {
        try { this.docEditor.destroyEditor(); } catch (e) { console.warn('Error cleanup', e); }
        this.docEditor = null;
      }
      
      this.configReceived = false;
      this.editorConfig = null;
      this.cargaExitosa = false;
  
      console.log(`📥 Solicitando configuración para Doc ID: ${this.oficioId}`);
      
      this.oficioDosajeService.getEditorConfigOficioDosaje(this.oficioId, 'edit').subscribe({
        next: (config: any) => {
          if (config.editorConfig && config.editorConfig.customization) {
              config.editorConfig.customization.autosave = false; 
              config.editorConfig.customization.forcesave = true;
          }
  
          this.editorConfig = config;
          this.configReceived = true;
          this.cargaExitosa = true; 
          this.intentarIniciarEditor();
        },
        error: (err) => {
          console.error('❌ Error al cargar config:', err);
          this.cargaExitosa = false; 
          
          Swal.fire({
            icon: 'error',
            title: 'Documento no encontrado',
            text: 'El documento que buscas no existe o fue eliminado.',
            timer: 5000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/dashboard/documento']);
          });
        }
      });
    }

    intentarIniciarEditor() {
    if (typeof DocsAPI !== 'undefined') {
      this.iniciarOnlyOffice();
    } else {
      console.warn('⏳ DocsAPI aún no está listo. Esperando...');
      this.waitForScript();
    }
  }
  waitForScript() {
    if (this.scriptCheckInterval) clearInterval(this.scriptCheckInterval);
    this.scriptCheckInterval = setInterval(() => {
      if (typeof DocsAPI !== 'undefined') {
        clearInterval(this.scriptCheckInterval);
        this.iniciarOnlyOffice();
      }
    }, 200);
  }

  iniciarOnlyOffice() {
    if (this.configReceived && !this.docEditor) {
      console.log('🚀 Iniciando instancia de ONLYOFFICE...');
      try {
        this.docEditor = new DocsAPI.DocEditor("contenedor_onlyoffice", this.editorConfig);
      } catch (e) {
        console.error('❌ Error crítico al crear DocEditor:', e);
      }
    }
  }

   guardarDocumento() {
    if (this.docEditor) {
      this.docEditor.serviceCommand("forcesave");
      this.guardadoExitoso = true;
      setTimeout(() => {
        this.router.navigate(['/dashboard/oficio-dosaje'], { 
          queryParams: { updatedId: this.oficioId } 
        });
      }, 1500);

    } else {
      console.warn('El editor no estaba listo para guardar.');
    }
  }

  regresar() { this.router.navigate(['/dashboard/oficio-dosaje']); }

  ngOnDestroy() {
    if (this.docEditor) {
      try { this.docEditor.destroyEditor(); } catch(e) {}
    }
    this.layoutService.showHeader();
  }
}