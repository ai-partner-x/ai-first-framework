export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  username: string;
  password?: string;
  email: string;
  enabled: boolean;
  roles?: Role[];
}
