export interface LoginEntity {
  username?: string;
  password?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
}
