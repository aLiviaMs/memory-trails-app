// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

// RxJS
import { Observable } from 'rxjs';

// Base Service
import { BaseService } from '../../../core/services/base.service';

// Models
import { IApiResponse, IRequestOptions } from '../../../core/models/interfaces';
import {
  IRecord,
  IRecordPaginationParams,
  IRecordSearchFilters,
} from './models/interfaces';

/**
 * Service responsible for managing record data operations
 * Extends BaseService to provide CRUD operations with additional record-specific methods
 *
 * @example
 * ```typescript
 * constructor(private recordsService: RecordsService) {}
 *
 * loadRecords() {
 *   this.recordsService.getAll({ page: 1, size: 20, sortBy: 'createdAt' })
 *     .subscribe(response => {
 *       console.log(response.data);
 *     });
 * }
 * ```
 *
 * @since 1.0.0
 * @author [Nome do Desenvolvedor]
 */
@Injectable({
  providedIn: 'root',
})
export class RecordsService extends BaseService<IRecord> {
  protected override endpoint = 'records';

  constructor() {
    super(inject(HttpClient));
  }

  /**
   * Gets all records with pagination and filtering support
   *
   * @param params - Pagination and filter parameters
   * @returns Observable of paginated records
   *
   * @example
   * ```typescript
   * const params: IRecordPaginationParams = {
   *   page: 1,
   *   size: 20,
   *   sortBy: 'createdAt',
   *   isFavorite: true
   * };
   *
   * this.recordsService.getAll(params).subscribe(response => {
   *   console.log(response.data);
   * });
   * ```
   */
  public override getAll(
    params?: IRecordPaginationParams
  ): Observable<IApiResponse<IRecord[]>> {
    const requestOptions = {
      params: this.buildRecordParams(params),
    };

    return this.get<IRecord[]>(undefined, requestOptions);
  }

  /**
   * Searches records with specific filters
   *
   * @param filters - Search filters to apply
   * @param params - Optional pagination parameters
   * @returns Observable of filtered records
   *
   * @example
   * ```typescript
   * const filters: IRecordSearchFilters = {
   *   isFavorite: true,
   *   dateFrom: '2024-01-01',
   *   dateTo: '2024-12-31'
   * };
   *
   * this.recordsService.searchRecords(filters).subscribe(response => {
   *   console.log(response.data);
   * });
   * ```
   */
  public searchRecords(
    filters: IRecordSearchFilters,
    params?: Omit<IRecordPaginationParams, keyof IRecordSearchFilters>
  ): Observable<IApiResponse<IRecord[]>> {
    const combinedParams = {
      ...params,
      ...filters,
    } as IRecordPaginationParams;

    return this.getAll(combinedParams);
  }

  /**
   * Toggles the favorite status of a record
   *
   * @param id - Record ID
   * @returns Observable of the updated record
   *
   * @example
   * ```typescript
   * this.recordsService.toggleFavorite('record-123').subscribe(response => {
   *   console.log('Favorite status updated:', response.data);
   * });
   * ```
   */
  public toggleFavorite(
    data: IRecord,
    options?: IRequestOptions
  ): Observable<IApiResponse<IRecord>> {
    const { id, ...record } = data;

    return this.partialUpdate(
      id,
      record,
      options
    );
  }

  /**
   * Gets only favorite records
   *
   * @param params - Optional pagination parameters
   * @returns Observable of favorite records
   *
   * @example
   * ```typescript
   * this.recordsService.getFavorites({ page: 1, size: 10 }).subscribe(response => {
   *   console.log('Favorite records:', response.data);
   * });
   * ```
   */
  public getFavorites(
    params?: Omit<IRecordPaginationParams, 'isFavorite'>
  ): Observable<IApiResponse<IRecord[]>> {
    const favoriteParams = {
      ...params,
      isFavorite: true,
    } as IRecordPaginationParams;

    return this.getAll(favoriteParams);
  }

  /**
   * Builds record-specific parameters for API requests
   *
   * @param params - Record pagination parameters
   * @returns Record of string parameters for HTTP request
   * @private
   */
  private buildRecordParams(
    params?: IRecordPaginationParams
  ): Record<string, string> {
    if (!params) return {};

    const apiParams: Record<string, string> = {};

    // Pagination
    if (params.page !== undefined) apiParams['page'] = params.page.toString();
    if (params.size !== undefined) apiParams['size'] = params.size.toString();
    if (params.sortBy) apiParams['sortBy'] = params.sortBy;

    // Filters
    if (params.isFavorite !== undefined) {
      apiParams['isFavorite'] = params.isFavorite.toString();
    }

    return apiParams;
  }
}
