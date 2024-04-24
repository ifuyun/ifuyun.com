import { AppParam } from '../../core/common.interface';

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
    expiresAt: number;
  };
}
