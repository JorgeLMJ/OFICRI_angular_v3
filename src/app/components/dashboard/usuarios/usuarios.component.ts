import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuariosPaginados: Usuario[] = [];
  usuarioForm!: FormGroup;
  usuarioSeleccionado: Usuario | null = null;
  terminoBusqueda: string = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 5;
  totalPaginas: number = 1;

  // 🚩 CONFIGURACIÓN DE ALERTA TEMPORAL (Sin clics)
  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      rol: ['', Validators.required]
    });
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = [...this.usuarios];
        this.actualizarPaginacion();
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  filtrarUsuarios(): void {
    const termino = this.terminoBusqueda.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.email.toLowerCase().includes(termino) ||
      usuario.rol.toLowerCase().includes(termino)
    );
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina);
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.usuariosPaginados = this.usuariosFiltrados.slice(inicio, fin);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  irAPagina(num: number): void {
    this.paginaActual = num;
    this.actualizarPaginacion();
  }

  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.paginaActual - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > this.totalPaginas) {
      end = this.totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  nuevoUsuario(): void {
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset();
    const modalEl = document.getElementById('usuarioModal');
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
    this.usuarioForm.get('password')?.setValue('');
    const modalEl = document.getElementById('usuarioModal');
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  guardarUsuario(): void {
    if (this.usuarioForm.valid) {
      const formValue = this.usuarioForm.value;
      const usuario: Usuario = {
        id: this.usuarioSeleccionado?.id,
        nombre: formValue.nombre,
        email: formValue.email,
        password: formValue.password || undefined,
        rol: formValue.rol
      };

      if (this.usuarioSeleccionado) {
        this.usuarioService.actualizarUsuario(usuario.id!, usuario).subscribe({
          next: () => {
            // 🚩 ALERTA TEMPORAL DE ACTUALIZACIÓN
            this.Toast.fire({ icon: 'success', title: 'Usuario actualizado correctamente' });
            this.cargarUsuarios();
            this.cerrarModal();
          },
          error: () => this.Toast.fire({ icon: 'error', title: 'No se pudo actualizar' })
        });
      } else {
        this.usuarioService.crearUsuario(usuario).subscribe({
          next: () => {
            // 🚩 ALERTA TEMPORAL DE CREACIÓN
            this.Toast.fire({ icon: 'success', title: 'Usuario creado correctamente' });
            this.cargarUsuarios();
            this.cerrarModal();
          },
          error: () => this.Toast.fire({ icon: 'error', title: 'El correo ya existe' })
        });
      }
    }
  }

  private cerrarModal() {
    const modalEl = document.getElementById('usuarioModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  eliminarUsuario(id: number): void {
    // 🚩 Mantenemos la confirmación (porque es una acción peligrosa) 
    // pero el mensaje de éxito final será automático.
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.usuarioService.eliminarUsuario(id).subscribe({
          next: () => {
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            this.filtrarUsuarios();
            // 🚩 ALERTA TEMPORAL DE ELIMINACIÓN
            this.Toast.fire({ icon: 'success', title: 'Usuario eliminado' });
          },
          error: () => this.Toast.fire({ icon: 'error', title: 'Error al eliminar' })
        });
      }
    });
  }
}