import { AppParam } from '../../core/common.interface';

export interface LoginEntity extends AppParam {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
}
