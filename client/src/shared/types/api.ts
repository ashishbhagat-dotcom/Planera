export interface PaginatedResponse<T> {
  count?: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface ApiErrorResponse {
  error: ApiErrorDetail
}

export class ApiError extends Error {
  code: string
  details?: Record<string, string[]>
  status: number

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message)
    this.name = 'ApiError'
    this.code = detail.code
    this.details = detail.details
    this.status = status
  }
}
