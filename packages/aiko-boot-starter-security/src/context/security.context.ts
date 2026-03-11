import { Injectable, Singleton } from '@ai-partner-x/aiko-boot';
import type { User } from '../entities/index.js';

@Injectable()
@Singleton()
export class SecurityContext {
  private currentUser: User | null = null;
  private currentRequest: any = null;

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentRequest(request: any): void {
    this.currentRequest = request;
    if (request.user) {
      this.currentUser = request.user;
    }
  }

  getCurrentRequest(): any {
    return this.currentRequest;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: string): boolean {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return this.currentUser.roles.some(function(r) {
      return r.name === role;
    });
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return this.currentUser.roles.some(function(r) {
      return roles.indexOf(r.name) !== -1;
    });
  }

  clear(): void {
    this.currentUser = null;
    this.currentRequest = null;
  }
}
