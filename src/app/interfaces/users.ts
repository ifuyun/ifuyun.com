export interface UserEntity {
  userId: string;
  userNiceName: string;
  userEmail: string;
  userRegistered: Date;
  userStatus: number;
}

export interface UserModel extends UserEntity {
  userLogin?: string;
  userLink?: string;
  userEmailHash?: string;
  isAdmin?: boolean;
  meta?: Record<string, string>;
}

export interface Guest {
  name: string;
  email: string;
}
