  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { EmpleadoDTO } from '../../../models/empleado.model';
  import { EmpleadoService } from '../../../services/Empleado.service';
  import { UsuarioService } from '../../../services/usuario.service';
  import { Usuario } from '../../../models/usuario.model';
  import { LayoutService } from '../../../services/layout.service';
  import Swal from 'sweetalert2';

  declare var bootstrap: any;

  @Component({
    selector: 'app-empleados',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './empleados.component.html'
  })
  export class EmpleadosComponent implements OnInit {
    // Datos principales
    empleados: Array<EmpleadoDTO> = [];
    usuarios: Array<Usuario> = [];
    usuariosFiltrados: Array<Usuario> = [];
    usuariosAsignados: number[] = [];
    
    // Formulario y UI
    empleadoForm!: FormGroup;
    searchTerm = '';
    terminoBusquedaUsuario = '';
    editMode = false;

    // Paginación
    currentPage = 1;
    pageSize = 6;
    maxVisiblePages = 5;

    // Configuración de Toast Automático
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
      private empleadoService: EmpleadoService,
      private usuarioService: UsuarioService,
      private layoutService: LayoutService,
      private fb: FormBuilder
    ) {}

    ngOnInit(): void {
      this.initForm();
      this.loadInitialData();
    }

    initForm() {
      this.empleadoForm = this.fb.group({
        id: [null],
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
        telefono: [''],
        cargo: ['', Validators.required],
        estado: ['ACTIVO'],
        usuarioId: [null, Validators.required],
        usuarioEmail: ['']
      });
    }

    loadInitialData(): void {
      this.empleadoService.getAll().subscribe({
        next: (data) => {
          this.empleados = (data ?? []).map(emp => ({
            ...emp,
            estado: typeof emp.estado === 'boolean' ? (emp.estado ? 'Activo' : 'Inactivo') : emp.estado
          }));
          this.usuariosAsignados = this.empleados.filter(e => e.usuarioId).map(e => e.usuarioId!);
          this.goToPage(1);
        }
      });

      this.usuarioService.getAll().subscribe(data => {
        this.usuarios = data;
        this.filtrarUsuariosModal();
      });
    }

    // --- CONTROL MANUAL DE MODALES ---

    private getModal(id: string) {
      const el = document.getElementById(id);
      return bootstrap.Modal.getOrCreateInstance(el);
    }

    abrirModalNuevo() {
      this.editMode = false;
      this.empleadoForm.reset({ estado: 'ACTIVO' });
      this.filtrarUsuariosModal();
      this.getModal('empleadoModal').show();
    }

    editarEmpleado(id: number) {
      this.editMode = true;
      this.empleadoService.getById(id).subscribe(emp => {
        this.empleadoForm.patchValue({ ...emp, estado: emp.estado || 'ACTIVO' });
        this.usuarioService.getById(emp.usuarioId!).subscribe(u => {
          this.empleadoForm.patchValue({ usuarioEmail: u.email, cargo: u.rol });
          this.filtrarUsuariosModal(emp.usuarioId);
          this.getModal('empleadoModal').show();
        });
      });
    }

    abrirSubModalUsuario() {
      this.getModal('empleadoModal').hide();
      setTimeout(() => {
        this.getModal('usuarioSubModal').show();
      }, 200);
    }

    cerrarSubModalYVolver() {
      this.getModal('usuarioSubModal').hide();
      setTimeout(() => {
        this.getModal('empleadoModal').show();
      }, 200);
    }

    seleccionarUsuario(u: Usuario) {
      this.empleadoForm.patchValue({ usuarioId: u.id, usuarioEmail: u.email, cargo: u.rol });
      this.Toast.fire({ icon: 'info', title: `Usuario vinculado` });
      this.cerrarSubModalYVolver();
    }

    cerrarTodo() {
      this.getModal('empleadoModal').hide();
      this.getModal('usuarioSubModal').hide();
      this.limpiarBackdrop();
    }

    limpiarBackdrop() {
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 150);
    }

    // --- ACCIONES DE DATOS ---

    guardarEmpleado() {
      if (this.empleadoForm.invalid) return;

      const data = this.empleadoForm.value;
      const peticion = this.editMode 
        ? this.empleadoService.update(data.id, data) 
        : this.empleadoService.create(data);

      peticion.subscribe({
        next: () => {
          const msj = this.editMode ? '✏️ Actualizado correctamente' : '✅ Registrado correctamente';
          this.Toast.fire({ icon: 'success', title: msj });
          this.layoutService.mostrarToast(msj, 'success');
          this.cerrarTodo();
          this.loadInitialData();
        },
        error: () => this.Toast.fire({ icon: 'error', title: 'Error al procesar' })
      });
    }

    confirmDelete(emp: EmpleadoDTO) {
      if (!emp.id) return;

      Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará permanentemente a: ${emp.nombre} ${emp.apellido}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then(res => {
        if (res.isConfirmed) {
          this.empleadoService.delete(emp.id!).subscribe({
            next: () => {
              const msj = '🗑️ Empleado eliminado correctamente';
              this.Toast.fire({ icon: 'success', title: msj });
              this.layoutService.mostrarToast(msj, 'success');
              this.loadInitialData();
            },
            error: () => {
              this.Toast.fire({ icon: 'error', title: '❌ Error al eliminar' });
            }
          });
        }
      });
    }

    toggleEstado(emp: EmpleadoDTO, event: any) {
      const nuevo = event.target.checked ? 'Activo' : 'Inactivo';
      this.empleadoService.updateEstado(emp.id!, nuevo).subscribe(() => {
        this.Toast.fire({ icon: 'success', title: `Estado: ${nuevo}` });
        emp.estado = nuevo;
      });
    }

    // --- MÉTODOS UI ---
    get filteredEmpleados(): EmpleadoDTO[] {
      const q = this.searchTerm.toLowerCase().trim();
      return this.empleados.filter(e => 
        e.nombre.toLowerCase().includes(q) || e.apellido.toLowerCase().includes(q) || e.dni.includes(q)
      );
    }

    get paginatedEmpleados(): EmpleadoDTO[] {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredEmpleados.slice(start, start + this.pageSize);
    }

    get totalPages() { return Math.ceil(this.filteredEmpleados.length / this.pageSize); }
    goToPage(p: number) { this.currentPage = Math.min(Math.max(1, p), this.totalPages || 1); }
    nextPage() { this.goToPage(this.currentPage + 1); }
    prevPage() { this.goToPage(this.currentPage - 1); }
    getPageNumbers() { return Array.from({length: this.totalPages || 1}, (_, i) => i + 1).slice(0, 5); }
    trackById(_: number, item: EmpleadoDTO) { return item.id; }
    
    filtrarUsuariosModal(permitirId?: number) {
      const term = this.terminoBusquedaUsuario.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter(u => 
        (u.id === permitirId || !this.usuariosAsignados.includes(u.id!)) &&
        (u.nombre.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      );
    }
  }