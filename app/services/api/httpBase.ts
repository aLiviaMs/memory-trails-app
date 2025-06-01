import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

export interface HttpBaseConfig {
  url?: string
  timeout?: number
  headers?: Record<string, string>
}

export class HttpBase {
  protected apisauce: ApisauceInstance
  protected entity: string

  constructor(entity: string, config: HttpBaseConfig = {}) {
    this.entity = entity
    this.apisauce = create({
      baseURL: config.url ?? Config.API_URL,
      timeout: config.timeout ?? 10000,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...config.headers,
      },
    })
  }

  protected async get<T>(
    path = "",
    params?: Record<string, any>,
  ): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
    const response: ApiResponse<T> = await this.apisauce.get(`${this.entity}${path}`, params)
    return this.handleResponse<T>(response)
  }

  protected async post<T>(
    path = "",
    data?: any,
  ): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
    const response: ApiResponse<T> = await this.apisauce.post(`${this.entity}${path}`, data)
    return this.handleResponse<T>(response)
  }

  protected async put<T>(
    path = "",
    data?: any,
  ): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
    const response: ApiResponse<T> = await this.apisauce.put(`${this.entity}${path}`, data)
    return this.handleResponse<T>(response)
  }

  protected async delete<T>(path = ""): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
    const response: ApiResponse<T> = await this.apisauce.delete(`${this.entity}${path}`)
    return this.handleResponse<T>(response)
  }

  protected async patch<T>(
    path = "",
    data?: any,
  ): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
    const response: ApiResponse<T> = await this.apisauce.patch(`${this.entity}${path}`, data)
    return this.handleResponse<T>(response)
  }

  private handleResponse<T>(response: ApiResponse<T>): { kind: "ok"; data: T } | GeneralApiProblem {
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      return { kind: "ok", data: response.data as T }
    } catch {
      return { kind: "bad-data" }
    }
  }

  public setHeader(key: string, value: string): void {
    this.apisauce.setHeader(key, value)
  }

  public setHeaders(headers: Record<string, string>): void {
    Object.entries(headers).forEach(([key, value]) => this.setHeader(key, value))
  }

  public setBaseURL(url: string): void {
    this.apisauce.setBaseURL(url)
  }
}
