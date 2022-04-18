export interface UserEntity {
  userId: string;
  userNiceName: string;
  userEmail: string;
  userRegistered: Date;
  userStatus: number;
}

export interface UserModel extends UserEntity {
  userLogin: string;
  userPass: string;
  userPassSalt: string;
  userLink: string;
  userActivationKey: string;
}

export interface LoginUserEntity {
  userName?: string;
  userEmail?: string;
  meta?: Record<string, string>;
  isAdmin?: boolean;
}
