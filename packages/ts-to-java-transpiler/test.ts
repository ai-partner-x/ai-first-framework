/**
 * Test class for TypeScript to Java transpilation
 */
export class User {
  /**
   * User ID
   */
  private id: number;
  
  /**
   * User name
   */
  private name: string;
  
  /**
   * User email
   */
  private email: string;
  
  /**
   * User age
   */
  private age: number;
  
  /**
   * User active status
   */
  private active: boolean;
  
  /**
   * User registration date
   */
  private registeredAt: Date;
  
  /**
   * User roles
   */
  private roles: string[];
  
  /**
   * Constructor
   */
  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.age = 0;
    this.active = true;
    this.registeredAt = new Date();
    this.roles = ['user'];
  }
  
  /**
   * Get user ID
   */
  public getId(): number {
    return this.id;
  }
  
  /**
   * Set user name
   */
  public setName(name: string): void {
    this.name = name;
  }
  
  /**
   * Get user name
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * Check if user is active
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * Add role to user
   */
  public addRole(role: string): void {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
    }
  }
  
  /**
   * Get user roles
   */
  public getRoles(): string[] {
    return this.roles;
  }
}

/**
 * User service interface
 */
export interface UserService {
  /**
   * Get user by ID
   */
  getUserById(id: number): User;
  
  /**
   * Create new user
   */
  createUser(name: string, email: string): User;
  
  /**
   * Update user
   */
  updateUser(user: User): User;
  
  /**
   * Delete user
   */
  deleteUser(id: number): boolean;
}

/**
 * User service implementation
 */
export class UserServiceImpl implements UserService {
  /**
   * Users map
   */
  private users: Map<number, User> = new Map();
  
  /**
   * Next user ID
   */
  private nextId: number = 1;
  
  /**
   * Get user by ID
   */
  public getUserById(id: number): User {
    return this.users.get(id) || null;
  }
  
  /**
   * Create new user
   */
  public createUser(name: string, email: string): User {
    const user = new User(this.nextId++, name, email);
    this.users.set(user.getId(), user);
    return user;
  }
  
  /**
   * Update user
   */
  public updateUser(user: User): User {
    this.users.set(user.getId(), user);
    return user;
  }
  
  /**
   * Delete user
   */
  public deleteUser(id: number): boolean {
    return this.users.delete(id);
  }
}

/**
 * Utility function to validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Constants
 */
export const MAX_USERS = 100;
export const DEFAULT_ROLE = 'user';
export const ADMIN_ROLE = 'admin';
