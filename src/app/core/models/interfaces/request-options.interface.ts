export interface IRequestOptions {
  headers?: { [key: string]: string };
  params?: { [key: string]: unknown };
  timeout?: number;
  retries?: number;
}
