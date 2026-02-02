import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConceptType } from '@prisma/client';

export class CreateChargeConceptDto {
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  percentage: number;

  @IsOptional()
  @IsEnum(ConceptType)
  type?: ConceptType = ConceptType.DESCUENTO;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCalculated?: boolean = true;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean = true;
}
