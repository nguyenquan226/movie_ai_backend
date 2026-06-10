export interface IUser {
  userId: number;
  email: string;
  password?: string;
  fullName: string;
  isActive?: boolean;
  roleId: number;
  roleName: string;
  genderCode: string;
  isVip: boolean;
  statusCode: string;
  avatarUrl: string;
  refreshToken?: string;
  permissions?: {
    name: string;
    apiPath: string;
    method: string;
    module: string;
  }[];
}
