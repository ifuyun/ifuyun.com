export interface LoginEntity {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    userId: string;
    userNickname: string;
  };
  token: {
    accessToken: string;
    expiresAt?: number;
  };
}

export interface SignupEntity {
  userNickname: string;
  userEmail: string;
  userPassword: string;
}
