import { InjectionToken } from '@angular/core';
import { ConversionApi } from './conversion-api.models';

export const CONVERSION_API = new InjectionToken<ConversionApi>('CONVERSION_API');
