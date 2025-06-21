export interface IApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  errors?: string[];
}
