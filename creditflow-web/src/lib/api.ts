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
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return data.data;
  }

  async getProfile(): Promise<Usuario> {
    const { data } = await this.client.get<ApiResponse<Usuario>>('/auth/profile');
    return data.data;
  }

  // Rutas
  async getRutas(params?: PaginationParams): Promise<PaginatedResponse<Ruta>> {
    const { data } = await this.client.get<PaginatedResponse<Ruta>>('/rutas', { params });
    return data;
  }

  async getRuta(id: number): Promise<Ruta> {
    const { data } = await this.client.get<Ruta>(`/rutas/${id}`);
    return data;
  }

  async createRuta(dto: CreateRutaDto): Promise<Ruta> {
    const { data } = await this.client.post<Ruta>('/rutas', dto);
    return data;
  }

  async updateRuta(id: number, dto: UpdateRutaDto): Promise<Ruta> {
    const { data } = await this.client.patch<Ruta>(`/rutas/${id}`, dto);
    return data;
  }

  async deleteRuta(id: number): Promise<void> {
    await this.client.delete(`/rutas/${id}`);
  }

  // Clientes
  async getClientes(filters?: FilterClienteDto): Promise<PaginatedResponse<Cliente>> {
    const { data } = await this.client.get<PaginatedResponse<Cliente>>('/clientes', { params: filters });
    return data;
  }

  async getCliente(id: number): Promise<Cliente> {
    const { data } = await this.client.get<Cliente>(`/clientes/${id}`);
    return data;
  }

  async createCliente(dto: CreateClienteDto): Promise<Cliente> {
    const { data } = await this.client.post<Cliente>('/clientes', dto);
    return data;
  }

  async updateCliente(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    const { data } = await this.client.patch<Cliente>(`/clientes/${id}`, dto);
    return data;
  }

  async deleteCliente(id: number): Promise<void> {
    await this.client.delete(`/clientes/${id}`);
  }

  // Prestamos
  async getPrestamos(filters?: FilterPrestamoDto): Promise<PaginatedResponse<Prestamo>> {
    const { data } = await this.client.get<PaginatedResponse<Prestamo>>('/prestamos', { params: filters });
    return data;
  }

  async getPrestamo(id: number): Promise<Prestamo> {
    const { data } = await this.client.get<Prestamo>(`/prestamos/${id}`);
    return data;
  }

  async createPrestamo(dto: CreatePrestamoDto): Promise<Prestamo> {
    const { data } = await this.client.post<Prestamo>('/prestamos', dto);
    return data;
  }

  // Pagos
  async getPagos(filters?: FilterPagoDto): Promise<PaginatedResponse<Pago>> {
    const { data } = await this.client.get<PaginatedResponse<Pago>>('/pagos', { params: filters });
    return data;
  }

  async createPago(dto: CreatePagoDto): Promise<Pago> {
    const { data } = await this.client.post<Pago>('/pagos', dto);
    return data;
  }

  // Gastos
  async getGastos(filters?: FilterGastoDto): Promise<PaginatedResponse<Gasto>> {
    const { data } = await this.client.get<PaginatedResponse<Gasto>>('/gastos', { params: filters });
    return data;
  }

  async createGasto(dto: CreateGastoDto): Promise<Gasto> {
    const { data } = await this.client.post<Gasto>('/gastos', dto);
    return data;
  }

  async deleteGasto(id: number): Promise<void> {
    await this.client.delete(`/gastos/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const { data } = await this.client.get('/');
    return data;
  }
}

export const api = new ApiClient();
