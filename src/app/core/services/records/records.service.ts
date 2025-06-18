import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiResponse, IRequestOptions } from '../../../core/models/interfaces';
import { BaseService } from '../../../core/services/base.service';
import {
  IRecord,
  IRecordPaginationParams,
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
  protected override endpoint = 'records';

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
    isFavorite?: boolean,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord[]>> {
    const params: IRecordPaginationParams = {
      page: pagination.page,
      size: pagination.size,
      sortBy: pagination.sortBy
    };

    // Adiciona o filtro de favorito apenas se fornecido
    if (isFavorite !== undefined) {
      params.isFavorite = isFavorite;
    }

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
    // Se não tem paginação, usa valores padrão
    const paginationParams = pagination || {
      page: 1,
      size: 10,
      sortBy: 'ASC' as const
    };

    // Usa o método principal com filtro de favoritos
    return this.getRecordsWithPagination(paginationParams, true, options);
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
}
