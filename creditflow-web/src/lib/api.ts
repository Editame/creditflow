import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type { 
  ApiResponse,
  PaginatedResponse,
  LoginDto, 
  AuthResponse,
  User,
  CreateUserDto,
  UpdateUserDto,
  Route,
  CreateRouteDto,
  UpdateRouteDto,
  Client,
  CreateClientDto,
  UpdateClientDto,
  FilterClientDto,
  Loan,
  CreateLoanDto,
  RefinanceLoanDto,
  FilterLoanDto,
  Payment,
  CreatePaymentDto,
  FilterPaymentDto,
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  FilterExpenseDto,
  ChargeConcept,
  CreateChargeConceptDto,
  UpdateChargeConceptDto,
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
    getProfile: async (): Promise<User> => {
      const { data } = await this.client.get<ApiResponse<User>>('/auth/profile');
      return data.data;
    },
  };

  // Users
  users = {
    getAll: async (params?: PaginationParams): Promise<User[]> => {
      const { data } = await this.client.get<PaginatedResponse<User>>('/usuarios', { params });
      return data.data;
    },
    getOne: async (id: number): Promise<User> => {
      const { data } = await this.client.get<User>(`/usuarios/${id}`);
      return data;
    },
    create: async (dto: CreateUserDto): Promise<User> => {
      const { data } = await this.client.post<User>('/usuarios', dto);
      return data;
    },
    update: async (id: number, dto: UpdateUserDto): Promise<User> => {
      const { data } = await this.client.patch<User>(`/usuarios/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/usuarios/${id}`);
    },
  };

  // Routes
  routes = {
    getAll: async (params?: PaginationParams): Promise<Route[]> => {
      const { data } = await this.client.get<PaginatedResponse<Route>>('/rutas', { params });
      return data.data;
    },
    getOne: async (id: number): Promise<Route> => {
      const { data } = await this.client.get<Route>(`/rutas/${id}`);
      return data;
    },
    create: async (dto: CreateRouteDto): Promise<Route> => {
      const { data } = await this.client.post<Route>('/rutas', dto);
      return data;
    },
    update: async (id: number, dto: UpdateRouteDto): Promise<Route> => {
      const { data } = await this.client.patch<Route>(`/rutas/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/rutas/${id}`);
    },
  };

  // Clients
  clients = {
    getAll: async (filters?: FilterClientDto): Promise<Client[]> => {
      const { data } = await this.client.get<PaginatedResponse<Client>>('/clientes', { params: filters });
      return data.data;
    },
    getOne: async (id: number): Promise<Client> => {
      const { data } = await this.client.get<Client>(`/clientes/${id}`);
      return data;
    },
    create: async (dto: CreateClientDto): Promise<Client> => {
      const { data } = await this.client.post<Client>('/clientes', dto);
      return data;
    },
    update: async (id: number, dto: UpdateClientDto): Promise<Client> => {
      const { data } = await this.client.patch<Client>(`/clientes/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/clientes/${id}`);
    },
  };

  // Loans
  loans = {
    getAll: async (filters?: FilterLoanDto): Promise<Loan[]> => {
      const { data } = await this.client.get<PaginatedResponse<Loan>>('/prestamos', { params: filters });
      return data.data;
    },
    getOne: async (id: number): Promise<Loan> => {
      const { data } = await this.client.get<Loan>(`/prestamos/${id}`);
      return data;
    },
    create: async (dto: CreateLoanDto): Promise<Loan> => {
      const { data } = await this.client.post<Loan>('/prestamos', dto);
      return data;
    },
    refinance: async (id: number, dto: RefinanceLoanDto): Promise<any> => {
      const { data } = await this.client.post(`/prestamos/${id}/refinanciar`, dto);
      return data;
    },
  };

  // Payments
  payments = {
    getAll: async (filters?: FilterPaymentDto): Promise<Payment[]> => {
      const { data } = await this.client.get<PaginatedResponse<Payment>>('/pagos', { params: filters });
      return data.data;
    },
    create: async (dto: CreatePaymentDto): Promise<Payment> => {
      const { data } = await this.client.post<Payment>('/pagos', dto);
      return data;
    },
  };

  // Expenses
  expenses = {
    getAll: async (filters?: FilterExpenseDto): Promise<Expense[]> => {
      const { data } = await this.client.get<PaginatedResponse<Expense>>('/gastos', { params: filters });
      return data.data;
    },
    create: async (dto: CreateExpenseDto): Promise<Expense> => {
      const { data } = await this.client.post<Expense>('/gastos', dto);
      return data;
    },
    update: async (id: number, dto: UpdateExpenseDto): Promise<Expense> => {
      const { data } = await this.client.patch<Expense>(`/gastos/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/gastos/${id}`);
    },
  };

  // Charge Concepts
  chargeConcepts = {
    getAll: async (): Promise<ChargeConcept[]> => {
      const { data } = await this.client.get('/charge-concepts');
      return data.data || data;
    },
    create: async (dto: CreateChargeConceptDto): Promise<ChargeConcept> => {
      const { data } = await this.client.post('/charge-concepts', dto);
      return data;
    },
    update: async (id: number, dto: UpdateChargeConceptDto): Promise<ChargeConcept> => {
      const { data } = await this.client.patch(`/charge-concepts/${id}`, dto);
      return data;
    },
    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/charge-concepts/${id}`);
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

// Export individual APIs
export const authApi = api.auth;
export const usersApi = api.users;
export const routesApi = api.routes;
export const clientsApi = api.clients;
export const loansApi = api.loans;
export const paymentsApi = api.payments;
export const expensesApi = api.expenses;
export const chargeConceptsApi = api.chargeConcepts;
