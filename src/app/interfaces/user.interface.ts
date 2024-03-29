import { AppParam } from '../core/common.interface';

export interface UserEntity extends AppParam {
  userId?: string;
  userNickname: string;
  userEmail?: string;
  userPassword?: string;
  userCreated?: Date;
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
