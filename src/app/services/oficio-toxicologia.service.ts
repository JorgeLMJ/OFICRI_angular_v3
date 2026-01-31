import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OficioToxicologia } from '../models/oficio-toxicologia.model';

@Injectable({
  providedIn: 'root'
})
export class OficioToxicologiaService {
  private apiUrl = 'http://localhost:8080/api/oficio-toxicologia';

  constructor(private http: HttpClient) {}

  getOficiosToxicologia(): Observable<OficioToxicologia[]> {
    return this.http.get<OficioToxicologia[]>(this.apiUrl);
  }

  getOficioToxicologiaById(id: number): Observable<OficioToxicologia> {
    return this.http.get<OficioToxicologia>(`${this.apiUrl}/${id}`);
  }

  createOficioToxicologia(oficio: OficioToxicologia): Observable<OficioToxicologia> {
    return this.http.post<OficioToxicologia>(this.apiUrl, oficio);
  }

  updateOficioToxicologia(id: number, oficio: OficioToxicologia): Observable<OficioToxicologia> {
    return this.http.put<OficioToxicologia>(`${this.apiUrl}/${id}`, oficio);
  }

  deleteOficioToxicologia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEditorConfigOficioToxicologia(id: number, mode: 'edit' | 'view' = 'edit'): Observable<any> {
    let params = new HttpParams().set('mode', mode).set('t', new Date().getTime().toString());
    return this.http.get(`${this.apiUrl}/${id}/editor-config`, { params });
  }

  downloadOficioDosajeFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  uploadOficioToxicologia(id: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, 'oficio_editado.docx');
    return this.http.post(`${this.apiUrl}/${id}/upload`, formData, {
      responseType: 'text'
    });
  }
  crearNuevoOficioToxicologiaVacio(): Observable<number> {
  return this.http.post<number>(`${this.apiUrl}/nuevo`, {});
  }

  actualizarTagWord(id: number, tag: string, valor: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/actualizar-tag`, { tag, valor });
  }
  sincronizarDatos(id: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/${id}/sincronizar`, {});
} 
}