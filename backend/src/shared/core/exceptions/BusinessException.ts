export interface IBusinessExceptionPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class BusinessException extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(payload: IBusinessExceptionPayload) {
    super(payload.message);
    this.name = this.constructor.name;
    this.code = payload.code;
    this.details = payload.details;
    Error.captureStackTrace(this, this.constructor);
  }

  static create(payload: IBusinessExceptionPayload): BusinessException {
    return new BusinessException(payload);
  }
}
