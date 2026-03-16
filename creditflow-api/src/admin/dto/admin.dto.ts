import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlanType {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export class CreateAdminUserDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CreateTenantDto {
  @IsString()
  nombre!: string;

  @IsString()
  slug!: string;

  @IsEnum(PlanType)
  plan!: PlanType;

  @IsNumber()
  maxUsuarios!: number;

  @IsNumber()
  maxClientes!: number;

  @IsNumber()
  maxRutas!: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  contactoEmail?: string;

  @IsOptional()
  @IsString()
  contactoTelefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ValidateNested()
  @Type(() => CreateAdminUserDto)
  adminUser!: CreateAdminUserDto;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @IsOptional()
  @IsNumber()
  maxUsuarios?: number;

  @IsOptional()
  @IsNumber()
  maxClientes?: number;

  @IsOptional()
  @IsNumber()
  maxRutas?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  contactoEmail?: string;

  @IsOptional()
  @IsString()
  contactoTelefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}