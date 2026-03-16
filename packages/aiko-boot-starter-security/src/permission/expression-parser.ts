export interface PermissionExpression {
  type: 'hasRole' | 'hasPermission' | 'hasAnyRole' | 'hasAllRoles' | 'authenticated';
  value: string | string[];
}

export class PermissionExpressionParser {
  parse(expression: string): PermissionExpression {
    const trimmed = expression.trim();

    if (trimmed.startsWith("hasRole('") && trimmed.endsWith("')")) {
      const role = trimmed.slice(9, -2);
      return { type: 'hasRole', value: role };
    }

    if (trimmed.startsWith("hasPermission('") && trimmed.endsWith("')")) {
      const permission = trimmed.slice(15, -2);
      return { type: 'hasPermission', value: permission };
    }

    if (trimmed.startsWith("hasAnyRole('") && trimmed.endsWith("')")) {
      const rolesStr = trimmed.slice(12, -2);
      const roles = rolesStr.split("', '");
      return { type: 'hasAnyRole', value: roles };
    }

    if (trimmed.startsWith("hasAllRoles('") && trimmed.endsWith("')")) {
      const rolesStr = trimmed.slice(13, -2);
      const roles = rolesStr.split("', '");
      return { type: 'hasAllRoles', value: roles };
    }

    if (trimmed === 'authenticated()') {
      return { type: 'authenticated', value: '' };
    }

    throw new Error('Invalid permission expression: ' + expression);
  }

  evaluate(expression: PermissionExpression, user: any): boolean {
    switch (expression.type) {
      case 'hasRole':
        return this.evaluateHasRole(user, expression.value as string);

      case 'hasPermission':
        return this.evaluateHasPermission(user, expression.value as string);

      case 'hasAnyRole':
        return this.evaluateHasAnyRole(user, expression.value as string[]);

      case 'hasAllRoles':
        return this.evaluateHasAllRoles(user, expression.value as string[]);

      case 'authenticated':
        return this.evaluateAuthenticated(user);

      default:
        return false;
    }
  }

  private evaluateHasRole(user: any, role: string): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some(function(r: any) {
      return r.name === role;
    });
  }

  private evaluateHasPermission(user: any, permission: string): boolean {
    if (!user) return false;

    // 优先检查直接的permissions字段（业务代码格式）
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    // 降级到嵌套的roles结构
    if (!user.roles) return false;
    return user.roles.some(function(r: any) {
      if (!r.permissions) return false;
      return r.permissions.some(function(p: any) {
        // 支持字符串或对象格式
        const permName = typeof p === 'string' ? p : p.name;
        return permName === permission;
      });
    });
  }

  private evaluateHasAnyRole(user: any, roles: string[]): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some(function(r: any) {
      return roles.indexOf(r.name) !== -1;
    });
  }

  private evaluateHasAllRoles(user: any, roles: string[]): boolean {
    if (!user || !user.roles) return false;
    const userRoles = user.roles.map(function(r: any) {
      return r.name;
    });
    return roles.every(function(role) {
      return userRoles.indexOf(role) !== -1;
    });
  }

  private evaluateAuthenticated(user: any): boolean {
    return !!user && !!user.id;
  }
}
