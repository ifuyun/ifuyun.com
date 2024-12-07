export class CustomError extends Error {
  private status: number;
  private response: string;

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
