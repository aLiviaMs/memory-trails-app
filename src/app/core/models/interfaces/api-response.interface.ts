export interface IApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
