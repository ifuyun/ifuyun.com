import { AppParam } from './common';

export interface LoginEntity extends AppParam {
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
  appId: string;
}

export interface SignupEntity extends AppParam {
  userNickname: string;
  userEmail: string;
  userPassword: string;
}
