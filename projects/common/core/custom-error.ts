export class CustomError extends Error {
  private readonly status: number;
  private readonly response: string;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.response = message;
  }

  getStatus() {
    return this.status;
  }

  getResponse() {
    return this.response;
  }
}
