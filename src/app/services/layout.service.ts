import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Estado inicial: Menú lateral abierto (true)
  private menuOpenSubject = new BehaviorSubject<boolean>(true);
  isMenuOpen$ = this.menuOpenSubject.asObservable();

  // 👇 NUEVO: Estado del Header Superior (Por defecto visible)
  private headerVisibleSubject = new BehaviorSubject<boolean>(true);
  headerVisible$ = this.headerVisibleSubject.asObservable();

  constructor() {}

  // Métodos Sidebar (Ya los tenías)
  closeMenu() { this.menuOpenSubject.next(false); }
  openMenu() { this.menuOpenSubject.next(true); }
  toggleMenu() { this.menuOpenSubject.next(!this.menuOpenSubject.value); }

  // 👇 NUEVOS MÉTODOS PARA EL HEADER
  hideHeader() { this.headerVisibleSubject.next(false); }
  showHeader() { this.headerVisibleSubject.next(true); }
}