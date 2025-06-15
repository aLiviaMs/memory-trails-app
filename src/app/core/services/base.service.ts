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

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected readonly baseUrl = environment.apiUrl;
  protected readonly timeout = environment.apiTimeout;
  protected readonly retryAttempts = environment.retryAttempts;
  protected readonly retryDelay = environment.retryDelay;

  constructor(protected http: HttpClient) {}

  protected get<T>(
    endpoint: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    const url = this._buildUrl(endpoint);
    const httpOptions = this._buildHttpOptions(options);

    return this._executeWithRetry(() =>
      this.http.get<IApiResponse<T>>(url, httpOptions)
    );
  }

  /**
   * Realiza requisição POST
   */
  protected post<T>(
    endpoint: string,
    body: unknown,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    const url = this._buildUrl(endpoint);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.post<IApiResponse<T>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Realiza requisição PUT
   */
  protected put<T>(
    endpoint: string,
    body: unknown,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    const url = this._buildUrl(endpoint);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.put<IApiResponse<T>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Realiza requisição PATCH
   */
  protected patch<T>(
    endpoint: string,
    body: unknown,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    const url = this._buildUrl(endpoint);
    const httpOptions = this._buildHttpOptions(options);

    return this.http.patch<IApiResponse<T>>(url, body, httpOptions).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Realiza requisição DELETE
   */
  protected delete<T>(
    endpoint: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<T>> {
    const url = this._buildUrl(endpoint);
    const httpOptions = this._buildHttpOptions(options);

    return this._executeWithRetry(() =>
      this.http.delete<IApiResponse<T>>(url, httpOptions)
    );
  }

  /**
   * Constrói a URL completa
   */
  private _buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
  }

  /**
   * Constrói as opções HTTP
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
   * Constrói parâmetros de paginação
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
   * Executa requisição com retry usando recursão
   */
  private _executeWithRetry<T>(
    requestFn: () => Observable<T>,
    attempt: number = 0
  ): Observable<T> {
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
   * Verifica se deve tentar novamente
   */
  private _shouldRetry(error: HttpErrorResponse, attempt: number): boolean {
    if (attempt >= this.retryAttempts) {
      return false;
    }

    // Retry apenas para erros de rede (status 0) ou 5xx
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  /**
   * Calcula o delay para retry com backoff exponencial
   */
  private _calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Manipula erros HTTP
   */
  private _handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: IApiError;

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      apiError = {
        message: 'Erro de conexão. Verifique sua internet.',
        status: 0,
        error: error.error.message
      };
    } else {
      // Erro do lado do servidor
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
   * Extrai mensagem de erro do response
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
   * Retorna mensagem de erro padrão baseada no status
   */
  private _getDefaultErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Requisição inválida',
      401: 'Não autorizado',
      403: 'Acesso negado',
      404: 'Recurso não encontrado',
      409: 'Conflito de dados',
      422: 'Dados inválidos',
      500: 'Erro interno do servidor',
      502: 'Servidor indisponível',
      503: 'Serviço temporariamente indisponível'
    };

    return errorMessages[status] || 'Erro desconhecido';
  }

  /**
   * Log de erros
   */
  private _logError(error: IApiError): void {
    if (!environment.production) {
      console.error('Erro na requisição:', error);
    }
  }

  /**
   * Método utilitário para upload de arquivos
   */
  protected uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string | number | boolean>
  ): Observable<IApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    const url = this._buildUrl(endpoint);

    return this.http.post<IApiResponse<T>>(url, formData).pipe(
      catchError(this._handleError.bind(this))
    );
  }

  /**
   * Método utilitário para download de arquivos
   */
  protected downloadFile(
    endpoint: string,
    filename: string,
    options?: IRequestOptions
  ): Observable<Blob> {
    const url = this._buildUrl(endpoint);
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
   * Executa o download do blob
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
