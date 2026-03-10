export class LoginDto {
  username!: string;
  password!: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}

export interface TokenVo {
  accessToken: string;
  refreshToken: string;
  userInfo: {
    id: number;
    username: string;
    realName?: string;
    roles: string[];
    permissions: string[];
  };
}
