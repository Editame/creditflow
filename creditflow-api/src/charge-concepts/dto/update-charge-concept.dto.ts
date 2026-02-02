import { PartialType } from '@nestjs/mapped-types';
import { CreateChargeConceptDto } from './create-charge-concept.dto';

export class UpdateChargeConceptDto extends PartialType(CreateChargeConceptDto) {}
