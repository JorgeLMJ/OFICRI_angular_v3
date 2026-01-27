import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OficioDosaje } from '../models/oficio-dosaje.model';

@Injectable({
  providedIn: 'root'
})
export class OficioDosajeService {
  private apiUrl = 'http://localhost:8080/api/oficio-dosaje';

  constructor(private http: HttpClient) {}

  // --- CRUD BÁSICO ---
  getOficiosDosaje(): Observable<OficioDosaje[]> {
    return this.http.get<OficioDosaje[]>(this.apiUrl);
  }

  getOficioDosajeById(id: number): Observable<OficioDosaje> {
    return this.http.get<OficioDosaje>(`${this.apiUrl}/${id}`);
  }

  createOficioDosaje(oficio: OficioDosaje): Observable<OficioDosaje> {
    return this.http.post<OficioDosaje>(this.apiUrl, oficio);
  }

  updateOficioDosaje(id: number, oficio: OficioDosaje): Observable<OficioDosaje> {
    return this.http.put<OficioDosaje>(`${this.apiUrl}/${id}`, oficio);
  }

  deleteOficioDosaje(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEditorConfigOficioDosaje(id: number, mode: 'edit' | 'view' = 'edit'): Observable<any> {
    let params = new HttpParams().set('mode', mode).set('t', new Date().getTime().toString());
    return this.http.get(`${this.apiUrl}/${id}/editor-config`, { params });
  }

  downloadOficioDosajeFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  uploadOficioDosaj(id: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, 'oficio_editado.docx');
    return this.http.post(`${this.apiUrl}/${id}/upload`, formData, {
      responseType: 'text'
    });
  }
  crearNuevoOficioDosajeVacio(): Observable<number> {
  return this.http.post<number>(`${this.apiUrl}/nuevo`, {});
  }

  actualizarTagWord(id: number, tag: string, valor: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/actualizar-tag`, { tag, valor });
  }
  sincronizarDatos(id: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/${id}/sincronizar`, {});
} 
}