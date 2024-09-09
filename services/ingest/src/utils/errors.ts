export class CustomError extends Error {
  public name: string = 'CustomError';
  public code: number = 500;
  public message: string;
  public stack?: string;

  constructor(message: string) {
    super(message);
    this.message = message;
    this.stack = Error().stack;
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message
    };
  }

  public toString() {
    return `${this.name}: ${this.message}`;
  }
}

export class DownstreamError extends CustomError {
  public service: string;
  constructor(service: string, message: string) {
    super(message);
    this.service = service;
    this.name = 'DownstreamError';
    this.code = 500;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      service: this.service
    };
  }
}

export const handleDanglingError = (error: unknown) => {
  console.warn(error?.toString());

  // If a known, critical error, exit with a non-zero code
  if (error instanceof CustomError) {
    if (error.code === 500) {
      process.emit('SIGINT');
    }
    return;
  }

  // If we don't know about the error, exit with a non-zero code
  if (error) {
    process.emit('SIGINT');
  }
};

export const dispose = (disposable: AsyncDisposable) => {
  return disposable[Symbol.asyncDispose]();
};
