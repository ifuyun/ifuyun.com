export interface LoginEntity {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
}
