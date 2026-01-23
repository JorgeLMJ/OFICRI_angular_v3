import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documento } from '../models/documento.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private apiUrl = 'http://localhost:8080/api/documentos';

  constructor(private http: HttpClient) { }

  // --- CRUD BÁSICO ---
  getDocumentos(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrl);
  }

  getDocumentoById(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrl}/${id}`);
  }

  createDocumento(documento: Documento): Observable<Documento> {
    return this.http.post<Documento>(this.apiUrl, documento);
  }

  updateDocumento(id: number, documento: Documento): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrl}/${id}`, documento);
  }

  deleteDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEditorConfig(id: number, mode: 'edit' | 'view' = 'edit'): Observable<any> {
    let params = new HttpParams().set('mode', mode);
    return this.http.get(`${this.apiUrl}/${id}/editor-config`, { params });
  }

  /**
   * Descarga el archivo físico (.docx) sin abrir el editor
   */
  downloadDocumentoFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Guarda un documento editado manualmente en la base de datos
   */
  uploadDocumento(id: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, 'documento_editado.docx');
    
    return this.http.post(`${this.apiUrl}/${id}/upload`, formData, {
      responseType: 'text'
    });
  }

  crearNuevoDocumentoVacio(): Observable<number> {
  return this.http.post<number>(`${this.apiUrl}/nuevo`, {});
}
}