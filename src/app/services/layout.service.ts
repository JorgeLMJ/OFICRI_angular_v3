import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Estado inicial: Menú abierto (true)
  private menuOpenSubject = new BehaviorSubject<boolean>(true);
  isMenuOpen$ = this.menuOpenSubject.asObservable();

  constructor() {}

  // Métodos para controlar el menú desde cualquier lugar
  closeMenu() {
    this.menuOpenSubject.next(false);
  }

  openMenu() {
    this.menuOpenSubject.next(true);
  }

  toggleMenu() {
    this.menuOpenSubject.next(!this.menuOpenSubject.value);
  }
}