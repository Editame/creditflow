import { UserRole } from '../enums';

export interface User {
  id: number;
  tenantId: string | null;
  username: string;
  email: string | null;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  enabledFeatures?: string[];
}

export interface UserSafe extends Omit<User, 'password'> {
  // Sin password para respuestas
}

export interface CreateUserDto {
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}

// Alias para compatibilidad
export type Usuario = User;
export type CreateUsuarioDto = CreateUserDto;
export type UpdateUsuarioDto = UpdateUserDto;
