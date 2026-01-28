import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auditoria } from '../../../models/auditoria.model';
import { AuditoriaService } from '../../../services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class AuditoriaComponent implements OnInit {
  auditorias: Auditoria[] = [];
  loading = true;

  constructor(private auditoriaService: AuditoriaService) {}

  ngOnInit(): void {
    this.auditoriaService.getAll().subscribe({
      next: (data) => {
        this.auditorias = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  verDetalles(json: string): void {
    try {
      const parsed = JSON.parse(json);
      alert(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert(json);
    }
  }
  // Variables para paginación
currentPage = 1;
pageSize = 10;

// Método para obtener los datos de la página actual
get paginatedAuditorias(): Auditoria[] {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  return this.auditorias.slice(startIndex, startIndex + this.pageSize);
}

get totalPages(): number {
  return Math.ceil(this.auditorias.length / this.pageSize) || 1;
}

// Generar números de página visibles
getPageNumbers() {
  const total = this.totalPages;
  const current = this.currentPage;
  const pages = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i);
  }
  return pages;
}

goToPage(p: number) {
  this.currentPage = Math.min(Math.max(1, p), this.totalPages);
}
}