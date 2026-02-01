import { FrecuenciaPago, EstadoPrestamo } from '../enums';

// ============================================
// CLIENTE
// ============================================

export interface Cliente {
  id: number;
  tenantId: string;
  rutaId: number;
  cedula: string;
  nombreCompleto: string;
  telefono: string | null;
  direccion: string | null;
  urlFotoCedula: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClienteDto {
  rutaId: number;
  cedula: string;
  nombreCompleto: string;
  telefono?: string;
  direccion?: string;
  urlFotoCedula?: string;
}

export interface UpdateClienteDto {
  rutaId?: number;
  cedula?: string;
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
  urlFotoCedula?: string;
  activo?: boolean;
}

// ============================================
// PRÉSTAMO
// ============================================

export interface Prestamo {
  id: number;
  tenantId: string;
  clienteId: number;
  montoPrestado: number;
  tasaInteres: number;
  frecuenciaPago: FrecuenciaPago;
  valorCuota: number;
  saldoPendiente: number;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoPrestamo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrestamoDto {
  clienteId: number;
  montoPrestado: number;
  tasaInteres: number;
  frecuenciaPago: FrecuenciaPago;
  valorCuota: number;
  fechaInicio: string; // ISO date
}

export interface PrestamoWithRelations extends Prestamo {
  cliente: Cliente;
  pagos: Pago[];
}

// ============================================
// PAGO
// ============================================

export interface Pago {
  id: number;
  tenantId: string;
  prestamoId: number;
  cobradorId: number;
  rutaId: number;
  montoPagado: number;
  fechaPago: Date;
  observaciones: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePagoDto {
  prestamoId: number;
  montoPagado: number;
  observaciones?: string;
}

export interface PagoWithRelations extends Pago {
  prestamo: Prestamo;
  cobrador: {
    id: number;
    username: string;
  };
}

// ============================================
// RUTA
// ============================================

export interface Ruta {
  id: number;
  tenantId: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRutaDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateRutaDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// ============================================
// GASTO
// ============================================

export interface Gasto {
  id: number;
  tenantId: string;
  rutaId: number;
  monto: number;
  descripcion: string;
  categoria: string | null;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGastoDto {
  rutaId: number;
  monto: number;
  descripcion: string;
  categoria?: string;
  fecha?: string; // ISO date
}
