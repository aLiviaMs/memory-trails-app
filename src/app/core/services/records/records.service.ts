import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiResponse, IRequestOptions } from '../../../core/models/interfaces';
import { BaseService } from '../../../core/services/base.service';
import {
  IRecord,
  IRecordPaginationParams,
  IRecordSearchFilters,
  IUpdateRecordDto
} from './models/interfaces';

/**
 * Records service providing CRUD operations and additional record-specific functionality.
 * Extends BaseService with IRecord as the generic type for automatic typing.
 *
 * @example
 * ```typescript
 * // Basic CRUD operations (automatically typed)
 * this.recordsService.getAll() // Returns Observable<IApiResponse<IRecord[]>>
 * this.recordsService.getById(1) // Returns Observable<IApiResponse<IRecord>>
 * this.recordsService.create(recordData) // Returns Observable<IApiResponse<IRecord>>
 * this.recordsService.update(1, recordData) // Returns Observable<IApiResponse<IRecord>>
 * this.recordsService.remove(1) // Returns Observable<IApiResponse<void>>
 *
 * // Custom methods
 * this.recordsService.getRecordsWithPagination({ page: 1, size: 10, sortBy: 'title' })
 * this.recordsService.getFavoriteRecords()
 * this.recordsService.toggleFavorite(1)
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class RecordsService extends BaseService<IRecord> {

  /**
   * Creates an instance of RecordsService.
   *
   * @param http - Angular HttpClient
   */
  constructor(http: HttpClient) {
    super(http, 'records');
  }

  // ========== CUSTOM PAGINATION METHOD ==========

  /**
   * Gets records with specific pagination parameters as required by the API.
   * Uses the API's specific pagination format (page, size, sortBy).
   *
   * @param pagination - Records pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of paginated records
   *
   * @example
   * ```typescript
   * this.getRecordsWithPagination({
   *   page: 1,
   *   size: 10,
   *   sortBy: 'datePublished'
   * })
   * ```
   */
  getRecordsWithPagination(
    pagination: IRecordPaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    const params = {
      page: pagination.page,
      size: pagination.size,
      sortBy: pagination.sortBy
    };

    const requestOptions = {
      ...options,
      params: { ...options?.params, ...params }
    };

    return this.get<IRecord[]>(undefined, requestOptions);
  }

  // ========== RECORD-SPECIFIC METHODS ==========

  /**
   * Gets all favorite records.
   *
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of favorite records
   *
   * @example
   * ```typescript
   * this.getFavoriteRecords({ page: 1, size: 5, sortBy: 'datePublished' })
   * ```
   */
  getFavoriteRecords(
    pagination?: IRecordPaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    const filters = { isFavorite: true };

    if (pagination) {
      return this.searchRecords(filters as IRecordSearchFilters, pagination, options);
    }

    return this.search(filters, undefined, options);
  }

  /**
   * Gets records published within a date range.
   *
   * @param dateFrom - Start date (ISO string)
   * @param dateTo - End date (ISO string)
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of filtered records
   *
   * @example
   * ```typescript
   * this.getRecordsByDateRange(
   *   '2024-01-01T00:00:00Z',
   *   '2024-12-31T23:59:59Z',
   *   { page: 1, size: 10, sortBy: 'datePublished' }
   * )
   * ```
   */
  getRecordsByDateRange(
    dateFrom: string,
    dateTo: string,
    pagination?: IRecordPaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    const filters = { dateFrom, dateTo };

    if (pagination) {
      return this.searchRecords(filters, pagination, options);
    }

    return this.search(filters, undefined, options);
  }

  /**
   * Searches records with custom filters and pagination.
   *
   * @param filters - Search filters
   * @param pagination - Optional records-specific pagination
   * @param options - Optional request configuration
   * @returns Observable of filtered records
   *
   * @example
   * ```typescript
   * this.searchRecords(
   *   { title: 'Angular', isFavorite: true },
   *   { page: 1, size: 10, sortBy: 'title' }
   * )
   * ```
   */
  searchRecords(
    filters: IRecordSearchFilters,
    pagination?: IRecordPaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    let params: Record<string, unknown> = { ...filters };

    if (pagination) {
      params = {
        ...params,
        page: pagination.page,
        size: pagination.size,
        sortBy: pagination.sortBy
      };
    }

    const requestOptions = {
      ...options,
      params: { ...options?.params, ...params }
    };

    return this.get<IRecord[]>('search', requestOptions);
  }

  /**
   * Toggles the favorite status of a record.
   *
   * @param recordId - The record ID
   * @param options - Optional request configuration
   * @returns Observable of the updated record
   *
   * @example
   * ```typescript
   * this.toggleFavorite(1).subscribe(response => {
   *   console.log('Favorite status:', response.data.isFavorite);
   * });
   * ```
   */
  toggleFavorite(
    recordId: number,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord>> {
    return this.patch<IRecord>(
      { isFavorite: true }, // This would typically be calculated on the backend
      `${recordId}/toggle-favorite`,
      options
    );
  }

  /**
   * Sets a record as favorite.
   *
   * @param recordId - The record ID
   * @param options - Optional request configuration
   * @returns Observable of the updated record
   *
   * @example
   * ```typescript
   * this.setAsFavorite(1)
   * ```
   */
  setAsFavorite(
    recordId: number,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord>> {
    return this.partialUpdate(recordId, { isFavorite: true }, options);
  }

  /**
   * Removes a record from favorites.
   *
   * @param recordId - The record ID
   * @param options - Optional request configuration
   * @returns Observable of the updated record
   *
   * @example
   * ```typescript
   * this.removeFromFavorites(1)
   * ```
   */
  removeFromFavorites(
    recordId: number,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord>> {
    return this.partialUpdate(recordId, { isFavorite: false }, options);
  }

  /**
   * Bulk updates multiple records.
   *
   * @param updates - Array of record updates with IDs
   * @param options - Optional request configuration
   * @returns Observable of updated records
   *
   * @example
   * ```typescript
   * this.bulkUpdate([
   *   { id: 1, isFavorite: true },
   *   { id: 2, title: 'Updated Title' }
   * ])
   * ```
   */
  bulkUpdate(
    updates: Array<{ id: number } & Partial<IUpdateRecordDto>>,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    return this.post<IRecord[]>(updates, 'bulk-update', options);
  }

  /**
   * Bulk deletes multiple records.
   *
   * @param recordIds - Array of record IDs to delete
   * @param options - Optional request configuration
   * @returns Observable of deletion result
   *
   * @example
   * ```typescript
   * this.bulkDelete([1, 2, 3])
   * ```
   */
  bulkDelete(
    recordIds: number[],
    options?: IRequestOptions
  ): Observable<IApiResponse<void>> {
    return this.post<void>({ ids: recordIds }, 'bulk-delete', options);
  }
}
