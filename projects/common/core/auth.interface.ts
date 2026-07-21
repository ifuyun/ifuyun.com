export interface SigninDto {
  name: string;
  password: string;
}

export interface SigninResponse {
  user: {
    userId: string;
    nickname: string;
  };
  token: {
    token: string;
    expiresAt?: number;
  };
}

export interface SignupDto {
  nickname: string;
  email: string;
  password: string;
}
