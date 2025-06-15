// Angular
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

// RxJS
import { Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

// Models
import { IApiError, IApiResponse, IHttpOptions, IRequestOptions, PaginationParams } from '../models/interfaces';

// Environment
import { environment } from '../../../environments/environment';

/**
 * Base service class providing common HTTP operations with retry logic,
 * error handling, and standardized response format.
 *
 * @template T - The main entity type this service handles
 *
 * @example
 * ```typescript
 * interface IUser {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * @Injectable()
 * export class UserService extends BaseService<IUser> {
 *   constructor(http: HttpClient) {
 *     super(http, 'users');
 *   }
 *
 *   // Now you have all CRUD methods typed automatically!
 *   // getAll(), getById(), create(), update(), delete(), etc.
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class BaseService<T = unknown> {
  /** Base URL for all API requests */
  protected readonly baseUrl = environment.apiUrl;

  /** Default timeout for HTTP requests in milliseconds */
  protected readonly timeout = environment.apiTimeout;

  /** Maximum number of retry attempts for failed requests */
  protected readonly retryAttempts = environment.retryAttempts;

  /** Base delay between retry attempts in milliseconds */
  protected readonly retryDelay = environment.retryDelay;

  /**
   * Creates an instance of BaseService.
   *
   * @param http - Angular HttpClient for making HTTP requests
   * @param endpoint - The base endpoint for this service (e.g., 'users', 'products')
   */
  constructor(
    protected http: HttpClient,
    protected endpoint?: string
  ) {}

  /**
   * Performs a GET HTTP request with automatic retry for network errors.
   *
   * @template R - The expected response data type (defaults to T)
   * @param endpointPath - The API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.get<User[]>('users', { params: { page: 1 } })
   * this.get('users/1') // Returns Observable<IApiResponse<T>>
   * ```
   */
  protected get<R = T>(
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<R>> {
    const url = this._buildUrl(endpointPath);
    const httpOptions = this._buildHttpOptions(options);

    return this._executeWithRetry(() =>
      this.http.get<IApiResponse<R>>(url, httpOptions)
    );
  }

  /**
   * Performs a POST HTTP request.
   *
   * @template R - The expected response data type (defaults to T)
   * @param body - The request payload
   * @param endpointPath - Optional API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.post({ name: 'John', email: 'john@example.com' })
   * this.post(userData, 'users/bulk')
   * ```
   */
  protected post<R = T>(
    body: unknown,
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<R>> {
    const url = this._buildUrl(endpointPath);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.post<IApiResponse<R>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Performs a PUT HTTP request.
   *
   * @template R - The expected response data type (defaults to T)
   * @param body - The request payload
   * @param endpointPath - Optional API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.put({ name: 'John Updated' }, '1')
   * this.put(userData, 'users/1')
   * ```
   */
  protected put<R = T>(
    body: unknown,
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<R>> {
    const url = this._buildUrl(endpointPath);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.put<IApiResponse<R>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Performs a PATCH HTTP request.
   *
   * @template R - The expected response data type (defaults to T)
   * @param body - The request payload (partial update)
   * @param endpointPath - Optional API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.patch({ name: 'John' }, '1')
   * this.patch(partialData, 'users/1')
   * ```
   */
  protected patch<R = T>(
    body: unknown,
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<R>> {
    const url = this._buildUrl(endpointPath);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.patch<IApiResponse<R>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Performs a DELETE HTTP request with automatic retry for network errors.
   *
   * @template R - The expected response data type (defaults to void)
   * @param endpointPath - Optional API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.delete('1')
   * this.delete('users/1')
   * ```
   */
  protected delete<R = void>(
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<R>> {
    const url = this._buildUrl(endpointPath);
    const httpOptions = this._buildHttpOptions(options);

    return this._executeWithRetry(() =>
      this.http.delete<IApiResponse<R>>(url, httpOptions)
    );
  }

  // ========== CRUD CONVENIENCE METHODS ==========

  /**
   * Gets all entities with optional pagination.
   *
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of paginated entities
   *
   * @example
   * ```typescript
   * this.getAll({ page: 1, limit: 10 })
   * ```
   */
  public getAll(
    pagination?: PaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<T[]>> {
    const params = this.buildPaginationParams(pagination);
    const requestOptions = { ...options, params: { ...options?.params, ...params } };

    return this.get<T[]>(undefined, requestOptions);
  }

  /**
   * Gets a single entity by ID.
   *
   * @param id - The entity ID
   * @param options - Optional request configuration
   * @returns Observable of the entity
   *
   * @example
   * ```typescript
   * this.getById(1)
   * this.getById('user-123')
   * ```
   */
  public getById(
    id: string | number,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    return this.get<T>(id.toString(), options);
  }

  /**
   * Creates a new entity.
   *
   * @param data - The entity data to create
   * @param options - Optional request configuration
   * @returns Observable of the created entity
   *
   * @example
   * ```typescript
   * this.create({ name: 'John', email: 'john@example.com' })
   * ```
   */
  public create(
    data: Partial<T>,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    return this.post<T>(data, undefined, options);
  }

  /**
   * Updates an existing entity (full update).
   *
   * @param id - The entity ID
   * @param data - The complete entity data
   * @param options - Optional request configuration
   * @returns Observable of the updated entity
   *
   * @example
   * ```typescript
   * this.update(1, { name: 'John Updated', email: 'john.new@example.com' })
   * ```
   */
  public update(
    id: string | number,
    data: Partial<T>,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    return this.put<T>(data, id.toString(), options);
  }

  /**
   * Partially updates an existing entity.
   *
   * @param id - The entity ID
   * @param data - The partial entity data
   * @param options - Optional request configuration
   * @returns Observable of the updated entity
   *
   * @example
   * ```typescript
   * this.partialUpdate(1, { name: 'John' })
   * ```
   */
  public partialUpdate(
    id: string | number,
    data: Partial<T>,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    return this.patch<T>(data, id.toString(), options);
  }

  /**
   * Deletes an entity by ID.
   *
   * @param id - The entity ID
   * @param options - Optional request configuration
   * @returns Observable of the deletion result
   *
   * @example
   * ```typescript
   * this.remove(1)
   * this.remove('user-123')
   * ```
   */
  public remove(
    id: string | number,
    options?: IRequestOptions
  ): Observable<IApiResponse<void>> {
    return this.delete<void>(id.toString(), options);
  }

  /**
   * Searches entities with filters and pagination.
   *
   * @param filters - Search filters
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of filtered entities
   *
   * @example
   * ```typescript
   * this.search({ name: 'John' }, { page: 1, limit: 10 })
   * ```
   */
  public search(
    filters: Record<string, unknown>,
    pagination?: PaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<T[]>> {
    const params = {
      ...this.buildPaginationParams(pagination),
      ...filters
    };

    const requestOptions = { ...options, params: { ...options?.params, ...params } };

    return this.get<T[]>('search', requestOptions);
  }

  // ========== UTILITY METHODS ==========

  /**
   * Builds the complete URL by combining base URL, endpoint, and path.
   *
   * @param path - Optional additional path
   * @returns The complete URL
   * @private
   */
  private _buildUrl(path?: string): string {
    const parts = [this.baseUrl];

    if (this.endpoint) {
      parts.push(this.endpoint);
    }

    if (path) {
      parts.push(path.replace(/^\//, ''));
    }

    return parts.join('/');
  }

  /**
   * Builds HTTP options including headers and query parameters.
   *
   * @param options - Optional request configuration
   * @returns HTTP options object
   * @private
   */
  private _buildHttpOptions(options?: IRequestOptions): IHttpOptions {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    let params = new HttpParams();

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const stringValue =
            typeof value === 'object' && value !== null
              ? JSON.stringify(value)
              : value.toString();
          params = params.set(key, stringValue);
        }
      });
    }

    return {
      headers,
      params,
      timeout: options?.timeout ?? this.timeout
    };
  }

  /**
   * Builds pagination parameters from pagination options.
   *
   * @param pagination - Optional pagination configuration
   * @returns Record of pagination parameters
   *
   * @example
   * ```typescript
   * const params = this.buildPaginationParams({ page: 1, limit: 10 });
   * // Returns: { page: 1, limit: 10 }
   * ```
   */
  protected buildPaginationParams(pagination?: PaginationParams): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    if (pagination?.page !== undefined) params['page'] = pagination.page;
    if (pagination?.limit !== undefined) params['limit'] = pagination.limit;
    if (pagination?.sort) params['sort'] = pagination.sort;
    if (pagination?.order) params['order'] = pagination.order;

    return params;
  }

  /**
   * Executes HTTP request with automatic retry logic using exponential backoff.
   * Only retries on network errors (status 0) or server errors (5xx).
   *
   * @template R - The expected response type
   * @param requestFn - Function that returns the HTTP request observable
   * @param attempt - Current attempt number (used for recursion)
   * @returns Observable of the HTTP response
   * @private
   */
  private _executeWithRetry<R>(
    requestFn: () => Observable<R>,
    attempt: number = 0
  ): Observable<R> {
    return requestFn().pipe(
      catchError((error: HttpErrorResponse) => {
        if (this._shouldRetry(error, attempt)) {
          const delay = this._calculateRetryDelay(attempt);

          return timer(delay).pipe(
            switchMap(() => this._executeWithRetry(requestFn, attempt + 1))
          );
        }

        return this._handleError(error);
      })
    );
  }

  /**
   * Determines if a request should be retried based on error type and attempt count.
   *
   * @param error - The HTTP error response
   * @param attempt - Current attempt number
   * @returns True if request should be retried
   * @private
   */
  private _shouldRetry(error: HttpErrorResponse, attempt: number): boolean {
    if (attempt >= this.retryAttempts) {
      return false;
    }

    // Retry only for network errors (status 0) or 5xx server errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  /**
   * Calculates retry delay using exponential backoff strategy.
   *
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   * @private
   */
  private _calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Handles HTTP errors and transforms them into standardized API errors.
   *
   * @param error - The HTTP error response
   * @returns Observable that throws the standardized error
   * @private
   */
  private _handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: IApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        message: 'Connection error. Please check your internet connection.',
        status: 0,
        error: error.error.message
      };
    } else {
      // Server-side error
      const errorMessage = this._extractErrorMessage(error);
      apiError = {
        message: errorMessage,
        status: error.status,
        error: error.error
      };
    }

    this._logError(apiError);
    return throwError(() => apiError);
  }

  /**
   * Extracts error message from HTTP error response.
   *
   * @param error - The HTTP error response
   * @returns Extracted error message
   * @private
   */
  private _extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object') {
      const errorObj = error.error as Record<string, unknown>;

      if (typeof errorObj['message'] === 'string') {
        return errorObj['message'];
      }

      if (Array.isArray(errorObj['errors']) && errorObj['errors'].length > 0) {
        return errorObj['errors'][0] as string;
      }
    }

    return this._getDefaultErrorMessage(error.status);
  }

  /**
   * Returns default error message based on HTTP status code.
   *
   * @param status - HTTP status code
   * @returns Default error message
   * @private
   */
  private _getDefaultErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };

    return errorMessages[status] || 'Unknown Error';
  }

  /**
   * Logs error information in development environment.
   *
   * @param error - The API error to log
   * @private
   */
  private _logError(error: IApiError): void {
    if (!environment.production) {
      console.error('HTTP Request Error:', error);
    }
  }

  /**
   * Uploads a file with optional additional form data.
   *
   * @template R - The expected response data type
   * @param file - The file to upload
   * @param additionalData - Optional additional form data
   * @param endpointPath - Optional API endpoint path
   * @param options - Optional request configuration
   * @returns Observable of the API response
   *
   * @example
   * ```typescript
   * this.uploadFile<{url: string}>(file, { category: 'avatar' }, 'upload')
   * ```
   */
  protected uploadFile<R = { url: string }>(
    file: File,
    additionalData?: Record<string, string | number | boolean>,
    endpointPath?: string,
  ): Observable<IApiResponse<R>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    const url = this._buildUrl(endpointPath ?? 'upload');

    return this.http.post<IApiResponse<R>>(url, formData).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Downloads a file from the server and triggers browser download.
   *
   * @param filename - The filename for the downloaded file
   * @param endpointPath - Optional API endpoint path
   * @param options - Optional request configuration
   * @returns Observable of the downloaded blob
   *
   * @example
   * ```typescript
   * this.downloadFile('users-report.pdf', 'reports')
   * ```
   */
  protected downloadFile(
    filename: string,
    endpointPath?: string,
    options?: IRequestOptions
  ): Observable<Blob> {
    const url = this._buildUrl(endpointPath ?? 'download');
    const httpOptions = {
      ...this._buildHttpOptions(options),
      responseType: 'blob' as const
    };

    return this.http.get(url, httpOptions).pipe(
      tap((blob: Blob) => {
        this._downloadBlob(blob, filename);
      }),
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Triggers browser download of a blob with specified filename.
   *
   * @param blob - The blob data to download
   * @param filename - The filename for the download
   * @private
   */
  private _downloadBlob(blob: Blob, filename: string): void {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }
}
