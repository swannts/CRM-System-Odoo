export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = 'INTERNAL_ERROR',
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
