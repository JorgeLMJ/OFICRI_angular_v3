import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { AuthService } from '../../../services/auth.service';
import { LayoutService } from '../../../services/layout.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs'; 
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documento',
  templateUrl: './documento.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DocumentoComponent implements OnInit {
  documentos: Documento[] = [];
  searchTerm = '';

  currentPage = 1;
  pageSize = 6; 
  maxPagesToShow = 5; 
  private routerSubscription!: Subscription;
  
  updatingDocId: number | null = null; 
  countdown: number = 0;

  constructor(
    private documentoService: DocumentoService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    this.loadDocumentos();
    
    this.route.queryParams.subscribe(params => {
      const id = params['updatedId'];
      if (id) {
        this.iniciarContadorActualizacion(Number(id));
      }
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadDocumentos();
    });
  }

  iniciarContadorActualizacion(id: number) {
    this.updatingDocId = id;
    this.countdown = 7; 

    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(interval);
        this.updatingDocId = null; 
        this.loadDocumentos();     
        
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {}
        });
      }
    }, 1000); 
  }

  nuevoDocumento(): void {
    this.layoutService.closeMenu();
    Swal.fire({
      title: 'Creando documento...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.documentoService.crearNuevoDocumentoVacio().subscribe({
      next: (nuevoId) => {
        Swal.close();
        this.router.navigate(['/dashboard/onlyoffice-editor', nuevoId]);
      },
      error: (err) => {
        console.error('Error al crear:', err);
        Swal.fire('Error', 'No se pudo crear el documento', 'error');
        this.layoutService.openMenu(); 
      }
    });
  }

  editarDocumento(id: number): void {
    this.layoutService.closeMenu(); 
    this.router.navigate(['/dashboard/onlyoffice-editor', id]);
  }

  loadDocumentos(): void {
    this.documentoService.getDocumentos().subscribe({
      next: (data) => {
        this.documentos = (data || []).sort((a, b) => (b.id || 0) - (a.id || 0));
        this.currentPage = 1; 
      },
      error: (err) => console.error('Error cargando documentos', err)
    });
  }

  eliminarDocumento(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentoService.deleteDocumento(id).subscribe({
          next: () => {
            this.documentos = this.documentos.filter(d => d.id !== id);
            Swal.fire('Eliminado!', 'El documento ha sido eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

  // ==========================================
  // 🟢 LÓGICA DE PAGINACIÓN COMPLETA
  // ==========================================

  get filteredDocumentos(): Documento[] {
    const q = this.searchTerm.toLowerCase();
    if (!q) return this.documentos;
    
    return this.documentos.filter(doc => 
      (doc.nombresyapellidos?.toLowerCase().includes(q)) ||
      (doc.dni?.includes(q)) ||
      (doc.nombreDocumento?.toLowerCase().includes(q)) ||
      (doc.nombreOficio?.toLowerCase().includes(q)) ||
      // 👇 AGREGADO: También busca por valor cuantitativo
      (doc.cuantitativo?.toLowerCase().includes(q))
    );
  }

  get paginatedDocumentos(): Documento[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredDocumentos.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDocumentos.length / this.pageSize) || 1;
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const max = this.maxPagesToShow;

    let start = Math.max(1, current - Math.floor(max / 2));
    let end = Math.min(total, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  goToPage(page: number) { this.currentPage = page; }

  trackById(index: number, item: Documento): number {
    return item.id!;
  }

  trackByPage(index: number, page: number): number {
    return page;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  vistaPrevia(doc: Documento) {
    console.log('Vista previa para:', doc);
  }
}