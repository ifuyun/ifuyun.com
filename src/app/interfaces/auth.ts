export interface LoginEntity {
  username: string;
  password: string;
  rememberMe?: string | boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
}
