import { UserRole } from '../enums';
export interface Usuario {
    id: number;
    tenantId: string;
    username: string;
    email: string | null;
    role: UserRole;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date | null;
}
export interface UsuarioSafe extends Omit<Usuario, 'password'> {
}
export interface CreateUsuarioDto {
    username: string;
    email?: string;
    password: string;
    role: UserRole;
}
export interface UpdateUsuarioDto {
    username?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    activo?: boolean;
}
export interface LoginDto {
    username: string;
    password: string;
}
export interface AuthResponse {
    access_token: string;
    user: UsuarioSafe;
}
