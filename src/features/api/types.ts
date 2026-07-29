export type ApiErrorShape = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiDataShape<T> = {
  data: T;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(input: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

export type ApiFetchOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};
