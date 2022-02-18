export interface LoginEntity {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}
