import { SetMetadata } from '@nestjs/common';
import { FEATURE_KEY } from '../guards/feature.guard';

export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
