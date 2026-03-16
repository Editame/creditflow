// ============================================
// AUTHENTICATION
// ============================================

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: any; // Will be typed by User from usuario.types
}

// ============================================
// PAGINACIÓN
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// ============================================
// FILTROS
// ============================================

export interface FilterClienteDto extends PaginationParams {
  rutaId?: number;
  search?: string;
  activo?: boolean;
}

export interface FilterPrestamoDto extends PaginationParams {
  clienteId?: number;
  estado?: string;
  rutaId?: number;
}

export interface FilterPagoDto extends PaginationParams {
  rutaId?: number;
  fecha?: string;
  cobradorId?: number;
}

export interface FilterGastoDto extends PaginationParams {
  rutaId?: number;
  mes?: number;
  anio?: number;
  categoria?: string;
}
