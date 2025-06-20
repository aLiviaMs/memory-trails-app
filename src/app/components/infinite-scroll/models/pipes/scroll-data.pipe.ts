/* eslint-disable @typescript-eslint/no-explicit-any */
// Angular
import { Pipe, PipeTransform } from '@angular/core';

// Models
import { IScrollItem } from '../interfaces';

/**
 * Pipe to transform raw API data into IScrollItem format
 */
@Pipe({
  name: 'scrollData',
  standalone: true,
  pure: true
})
export class ScrollDataPipe implements PipeTransform {
  /**
   * Transforms raw data array into IScrollItem array
   * @param value - Raw data array from API
   * @param idField - Field name to use as ID (default: 'id')
   * @returns Transformed array of IScrollItem
   */
  transform(value: any[], idField: string = 'id'): IScrollItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => {
      const typedItem = item as Record<string, any>;
      return {
        id: typedItem[idField] as string | number,
        ...typedItem
      };
    });
  }
}
