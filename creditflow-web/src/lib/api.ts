import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type { 
  ApiResponse,
  PaginatedResponse,
  LoginDto, 
  AuthResponse,
  Usuario,
  Ruta,
  CreateRutaDto,
  UpdateRutaDto,
  Cliente,
  CreateClienteDto,
  UpdateClienteDto,
  FilterClienteDto,
  Prestamo,
  CreatePrestamoDto,
  FilterPrestamoDto,
  Pago,
  CreatePagoDto,
  FilterPagoDto,
  Gasto,
  CreateGastoDto,
  FilterGastoDto,
  PaginationParams
} from '@creditflow/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          Cookies.remove('token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  auth = {
    login: async (credentials: LoginDto): Promise<AuthResponse> => {
      const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return data.data;
    },
    getProfile: async (): Promise<Usuario> => {
      const { data } = await this.client.get<ApiResponse<Usuario>>('/auth/profile');
      return data.data;
    },
  };

  // Rutas
  rutas = {
    getAll: async (params?: PaginationParams): Promise<Ruta[]> => {
      const { data } = await this.client.get<PaginatedResponse<Ruta>>('/rutas', { params });
      return data.data;
    },
    getOne: async (id: number): Promise<Ruta> => {
      const { data } = await this.client.get<Ruta>(`/rutas/${id}`);
      return data;
    },
    create: async (dto: CreateRutaDto): Promise<Ruta> => {
      const { data } = await this.client.post<Ruta>('/rutas', dto);
      return data;
    },
    update: async (id: number, dto: UpdateRutaDto): Promise<Ruta> => {
      const { data } = await this.client.patch<Ruta>(`/rutas/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/rutas/${id}`);
    },
  };

  // Clientes
  clientes = {
    getAll: async (filters?: FilterClienteDto): Promise<Cliente[]> => {
      const { data } = await this.client.get<PaginatedResponse<Cliente>>('/clientes', { params: filters });
      return data.data;
    },
    getOne: async (id: number): Promise<Cliente> => {
      const { data } = await this.client.get<Cliente>(`/clientes/${id}`);
      return data;
    },
    create: async (dto: CreateClienteDto): Promise<Cliente> => {
      const { data } = await this.client.post<Cliente>('/clientes', dto);
      return data;
    },
    update: async (id: number, dto: UpdateClienteDto): Promise<Cliente> => {
      const { data } = await this.client.patch<Cliente>(`/clientes/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/clientes/${id}`);
    },
  };

  // Prestamos
  prestamos = {
    getAll: async (filters?: FilterPrestamoDto): Promise<Prestamo[]> => {
      const { data } = await this.client.get<PaginatedResponse<Prestamo>>('/prestamos', { params: filters });
      return data.data;
    },
    getOne: async (id: number): Promise<Prestamo> => {
      const { data } = await this.client.get<Prestamo>(`/prestamos/${id}`);
      return data;
    },
    create: async (dto: CreatePrestamoDto): Promise<Prestamo> => {
      const { data } = await this.client.post<Prestamo>('/prestamos', dto);
      return data;
    },
  };

  // Pagos
  pagos = {
    getAll: async (filters?: FilterPagoDto): Promise<Pago[]> => {
      const { data } = await this.client.get<PaginatedResponse<Pago>>('/pagos', { params: filters });
      return data.data;
    },
    create: async (dto: CreatePagoDto): Promise<Pago> => {
      const { data } = await this.client.post<Pago>('/pagos', dto);
      return data;
    },
  };

  // Gastos
  gastos = {
    getAll: async (filters?: FilterGastoDto): Promise<Gasto[]> => {
      const { data } = await this.client.get<PaginatedResponse<Gasto>>('/gastos', { params: filters });
      return data.data;
    },
    create: async (dto: CreateGastoDto): Promise<Gasto> => {
      const { data } = await this.client.post<Gasto>('/gastos', dto);
      return data;
    },
    update: async (id: number, dto: Partial<CreateGastoDto>): Promise<Gasto> => {
      const { data } = await this.client.patch<Gasto>(`/gastos/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/gastos/${id}`);
    },
  };

  // Charge Concepts
  chargeConcepts = {
    getAll: async (): Promise<any[]> => {
      const { data } = await this.client.get('/charge-concepts');
      return data.data || data;
    },
    create: async (dto: any): Promise<any> => {
      const { data } = await this.client.post('/charge-concepts', dto);
      return data;
    },
  };

  // Admin (SUPER_ADMIN only)
  admin = {
    getStats: async (): Promise<any> => {
      const { data } = await this.client.get('/admin/stats');
      return data.data || data;
    },
    getTenants: async (): Promise<any[]> => {
      const { data } = await this.client.get('/admin/tenants');
      return data.data || data;
    },
    createTenant: async (dto: any): Promise<any> => {
      const { data } = await this.client.post('/admin/tenants', dto);
      return data.data || data;
    },
    updateTenant: async (id: string, dto: any): Promise<any> => {
      const { data } = await this.client.patch(`/admin/tenants/${id}`, dto);
      return data.data || data;
    },
    deleteTenant: async (id: string): Promise<void> => {
      await this.client.delete(`/admin/tenants/${id}`);
    },
    getTenantUsers: async (id: string): Promise<any[]> => {
      const { data } = await this.client.get(`/admin/tenants/${id}/users`);
      return data.data || data;
    },
    getTenantLimits: async (id: string): Promise<any> => {
      const { data } = await this.client.get(`/admin/tenants/${id}/limits`);
      return data.data || data;
    },
    generateLicense: async (licenseData: any): Promise<any> => {
      const { data } = await this.client.post('/admin/licenses/generate', licenseData);
      return data.data || data;
    },
  };

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const { data } = await this.client.get('/');
    return data;
  }
}

export const api = new ApiClient();

// Export individual APIs for backward compatibility
export const clientesApi = api.clientes;
export const prestamosApi = api.prestamos;
export const pagosApi = api.pagos;
export const gastosApi = api.gastos;
export const rutasApi = api.rutas;
export const conceptosCobroApi = api.chargeConcepts;
