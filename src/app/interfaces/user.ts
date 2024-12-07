import { AppParam } from './common';

export interface UserEntity extends AppParam {
  userId?: string;
  userNickname: string;
  userEmail?: string;
  userPassword?: string;
  userCreated?: number;
  userStatus?: string;
}

export interface UserModel extends UserEntity {
  userName?: string;
  userLink?: string;
  userEmailHash?: string;
  userAvatar?: string;
  isAdmin?: boolean;
  meta?: Record<string, string>;
}

export interface Guest {
  name: string;
  email: string;
}
