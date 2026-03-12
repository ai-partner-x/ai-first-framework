/**
 * Parser Unit Tests
 * Tests for TypeScript AST parser functionality
 */
import { parseSourceFile, parseSourceFileFull } from './parser.js';
import type { ParsedClass, ParsedMethod, ParsedField, ParsedDecorator } from './types.js';

describe('Parser', () => {
  describe('parseSourceFile', () => {
    test('should parse a simple class', () => {
      const sourceCode = `
        @Entity
        class User {
          id: number;
          name: string;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('User');
      expect(classes[0].decorators).toHaveLength(1);
      expect(classes[0].decorators[0].name).toBe('Entity');
      expect(classes[0].fields).toHaveLength(2);
    });

    test('should parse multiple classes', () => {
      const sourceCode = `
        class User {
          id: number;
        }

        class Product {
          id: number;
          name: string;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(2);
      expect(classes[0].name).toBe('User');
      expect(classes[1].name).toBe('Product');
    });

    test('should parse empty file', () => {
      const sourceCode = '';
      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(0);
    });

    test('should parse class with methods', () => {
      const sourceCode = `
        class UserService {
          getUser(id: number): User {
            return new User();
          }

          createUser(user: User): void {
            console.log(user);
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].methods).toHaveLength(2);
      expect(classes[0].methods[0].name).toBe('getUser');
      expect(classes[0].methods[1].name).toBe('createUser');
    });

    test('should parse class with decorators', () => {
      const sourceCode = `
        @Service
        @Transactional
        class UserService {
          @Autowired
          private userRepository: UserRepository;

          @GetMapping('/users')
          getUsers(): User[] {
            return [];
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].decorators).toHaveLength(2);
      expect(classes[0].decorators[0].name).toBe('Service');
      expect(classes[0].decorators[1].name).toBe('Transactional');
      expect(classes[0].methods[0].decorators).toHaveLength(1);
      expect(classes[0].methods[0].decorators[0].name).toBe('GetMapping');
    });

    test('should parse class with constructor', () => {
      const sourceCode = `
        class UserService {
          constructor(private userRepository: UserRepository) {}
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].constructor).toBeDefined();
      expect(classes[0].constructor?.parameters).toHaveLength(1);
      expect(classes[0].constructor?.parameters[0].name).toBe('userRepository');
      expect(classes[0].constructor?.parameters[0].type).toBe('UserRepository');
    });

    test('should parse async methods', () => {
      const sourceCode = `
        class UserService {
          async getUser(id: number): Promise<User> {
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].methods[0].isAsync).toBe(true);
      expect(classes[0].methods[0].returnType).toBe('User');
    });

    test('should parse method parameters', () => {
      const sourceCode = `
        class UserService {
          updateUser(id: number, user: User, options?: UpdateOptions): void {
            console.log(id, user, options);
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].methods[0].parameters).toHaveLength(3);
      expect(classes[0].methods[0].parameters[0].name).toBe('id');
      expect(classes[0].methods[0].parameters[0].type).toBe('number');
      expect(classes[0].methods[0].parameters[1].name).toBe('user');
      expect(classes[0].methods[0].parameters[1].type).toBe('User');
      expect(classes[0].methods[0].parameters[2].name).toBe('options');
      expect(classes[0].methods[0].parameters[2].type).toBe('UpdateOptions');
    });

    test('should parse field decorators', () => {
      const sourceCode = `
        class User {
          @TableId
          id: number;

          @TableField('user_name')
          name: string;

          @Email
          email: string;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].fields[0].decorators).toHaveLength(1);
      expect(classes[0].fields[0].decorators[0].name).toBe('TableId');
      expect(classes[0].fields[1].decorators).toHaveLength(1);
      expect(classes[0].fields[1].decorators[0].name).toBe('TableField');
      expect(classes[0].fields[1].decorators[0].args).toEqual({ arg0: 'user_name' });
      expect(classes[0].fields[2].decorators).toHaveLength(1);
      expect(classes[0].fields[2].decorators[0].name).toBe('Email');
    });

    test('should parse optional fields', () => {
      const sourceCode = `
        class User {
          id: number;
          name?: string;
          email?: string;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].fields[0].optional).toBe(false);
      expect(classes[0].fields[1].optional).toBe(true);
      expect(classes[0].fields[2].optional).toBe(true);
    });

    test('should parse method decorators with arguments', () => {
      const sourceCode = `
        class UserController {
          @GetMapping('/users/{id}')
          @PreAuthorize('hasRole("ADMIN")')
          getUser(@PathVariable('id') id: number): User {
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].methods[0].decorators).toHaveLength(2);
      expect(classes[0].methods[0].decorators[0].name).toBe('GetMapping');
      expect(classes[0].methods[0].decorators[0].args).toEqual({ arg0: '/users/{id}' });
      expect(classes[0].methods[0].decorators[1].name).toBe('PreAuthorize');
      expect(classes[0].methods[0].decorators[1].args).toEqual({ arg0: 'hasRole("ADMIN")' });
      expect(classes[0].methods[0].parameters[0].decorators).toHaveLength(1);
      expect(classes[0].methods[0].parameters[0].decorators[0].name).toBe('PathVariable');
      expect(classes[0].methods[0].parameters[0].decorators[0].args).toEqual({ arg0: 'id' });
    });

    test('should parse class with JSDoc comments', () => {
      const sourceCode = `
        /**
         * User entity class
         * @description Represents a user in the system
         */
        class User {
          id: number;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].comment).toBeDefined();
      expect(classes[0].comment?.type).toBe('jsdoc');
      expect(classes[0].comment?.text).toContain('User entity class');
    });

    test('should parse Redis entity', () => {
      const sourceCode = `
        @RedisHash('userSession')
        class UserSession {
          @RedisKey
          @Id
          id: string;

          @Indexed
          userId: number;

          @RedisValue
          data: string;
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].decorators).toHaveLength(1);
      expect(classes[0].decorators[0].name).toBe('RedisHash');
      expect(classes[0].decorators[0].args).toEqual({ arg0: 'userSession' });
      expect(classes[0].fields[0].decorators).toHaveLength(2);
      expect(classes[0].fields[0].decorators[0].name).toBe('RedisKey');
      expect(classes[0].fields[0].decorators[1].name).toBe('Id');
    });

    test('should parse MQ listener', () => {
      const sourceCode = `
        @EnableBinding
        class OrderService {
          @StreamListener(Sink.INPUT)
          handleOrder(order: Order): void {
            console.log(order);
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].decorators).toHaveLength(1);
      expect(classes[0].decorators[0].name).toBe('EnableBinding');
      expect(classes[0].methods[0].decorators).toHaveLength(1);
      expect(classes[0].methods[0].decorators[0].name).toBe('StreamListener');
    });

    test('should parse security methods', () => {
      const sourceCode = `
        @EnableGlobalMethodSecurity
        class AdminService {
          @PreAuthorize('hasRole("ADMIN")')
          deleteUser(id: number): void {
            console.log(id);
          }

          @PostAuthorize('returnObject.owner == authentication.name')
          getDocument(id: number): Document {
            return new Document();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes).toHaveLength(1);
      expect(classes[0].decorators).toHaveLength(1);
      expect(classes[0].decorators[0].name).toBe('EnableGlobalMethodSecurity');
      expect(classes[0].methods[0].decorators).toHaveLength(1);
      expect(classes[0].methods[0].decorators[0].name).toBe('PreAuthorize');
      expect(classes[0].methods[1].decorators).toHaveLength(1);
      expect(classes[0].methods[1].decorators[0].name).toBe('PostAuthorize');
    });
  });

  describe('parseSourceFileFull', () => {
    test('should parse imports', () => {
      const sourceCode = `
        import { Entity, TableId } from '@ai-partner-x/aiko-boot-starter-orm';
        import { Service } from '@ai-partner-x/aiko-boot';
        import type { User } from './user.entity';

        class UserService {
          id: number;
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.imports).toHaveLength(3);
      expect(result.imports[0].modulePath).toBe('@ai-partner-x/aiko-boot-starter-orm');
      expect(result.imports[0].namedImports).toEqual(['Entity', 'TableId']);
      expect(result.imports[1].modulePath).toBe('@ai-partner-x/aiko-boot');
      expect(result.imports[1].namedImports).toEqual(['Service']);
      expect(result.imports[2].modulePath).toBe('./user.entity');
      expect(result.imports[2].isTypeOnly).toBe(true);
    });

    test('should parse default import', () => {
      const sourceCode = `
        import React from 'react';

        class Component {
          render(): void {
            console.log(React);
          }
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.imports).toHaveLength(1);
      expect(result.imports[0].defaultImport).toBe('React');
    });

    test('should parse namespace import', () => {
      const sourceCode = `
        import * as fs from 'fs';

        class FileReader {
          read(): void {
            console.log(fs);
          }
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.imports).toHaveLength(1);
      expect(result.imports[0].namespaceImport).toBe('fs');
    });

    test('should parse interfaces', () => {
      const sourceCode = `
        interface UserDto {
          id: number;
          name: string;
          email?: string;
        }

        class UserService {
          getUser(): UserDto {
            return { id: 1, name: 'test' };
          }
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.interfaces).toHaveLength(1);
      expect(result.interfaces[0].name).toBe('UserDto');
      expect(result.interfaces[0].properties).toHaveLength(3);
      expect(result.interfaces[0].properties[0].name).toBe('id');
      expect(result.interfaces[0].properties[0].type).toBe('number');
      expect(result.interfaces[0].properties[1].name).toBe('name');
      expect(result.interfaces[0].properties[1].type).toBe('string');
      expect(result.interfaces[0].properties[2].name).toBe('email');
      expect(result.interfaces[0].properties[2].optional).toBe(true);
    });

    test('should parse exported interfaces', () => {
      const sourceCode = `
        export interface UserDto {
          id: number;
        }

        interface InternalDto {
          id: number;
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.interfaces).toHaveLength(2);
      expect(result.interfaces[0].isExported).toBe(true);
      expect(result.interfaces[1].isExported).toBe(false);
    });

    test('should parse file comments', () => {
      const sourceCode = `
        /**
         * File header comment
         * @description This is a test file
         */

        class User {
          id: number;
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].type).toBe('jsdoc');
      expect(result.comments[0].text).toContain('File header comment');
    });

    test('should return complete file information', () => {
      const sourceCode = `
        import { Entity } from '@ai-partner-x/aiko-boot-starter-orm';

        /**
         * User entity
         */
        @Entity
        class User {
          id: number;
        }
      `;

      const result = parseSourceFileFull(sourceCode);
      expect(result.filePath).toBe('source.ts');
      expect(result.imports).toHaveLength(1);
      expect(result.classes).toHaveLength(1);
      expect(result.interfaces).toHaveLength(0);
      expect(result.comments).toHaveLength(1);
    });
  });

  describe('parseMethodBody', () => {
    test('should parse simple return statement', () => {
      const sourceCode = `
        class UserService {
          getUser(): User {
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toBeDefined();
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
    });

    test('should parse variable declaration', () => {
      const sourceCode = `
        class UserService {
          getUser(): User {
            const user = new User();
            return user;
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(2);
      expect(classes[0].methods[0].body![0].type).toBe('variable');
      expect(classes[0].methods[0].body![1].type).toBe('return');
    });

    test('should parse if statement', () => {
      const sourceCode = `
        class UserService {
          getUser(id: number): User | null {
            if (id > 0) {
              return new User();
            } else {
              return null;
            }
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('if');
    });

    test('should parse for-of loop', () => {
      const sourceCode = `
        class UserService {
          getAllUsers(): User[] {
            const users: User[] = [];
            for (const user of users) {
              console.log(user);
            }
            return users;
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(3);
      expect(classes[0].methods[0].body![0].type).toBe('variable');
      expect(classes[0].methods[0].body![1].type).toBe('for');
      expect(classes[0].methods[0].body![2].type).toBe('return');
    });

    test('should parse throw statement', () => {
      const sourceCode = `
        class UserService {
          getUser(id: number): User {
            if (id < 0) {
              throw new Error('Invalid id');
            }
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(2);
      expect(classes[0].methods[0].body![0].type).toBe('if');
      expect(classes[0].methods[0].body![0].thenBlock![0].type).toBe('throw');
    });

    test('should parse method call expression', () => {
      const sourceCode = `
        class UserService {
          getUser(id: number): User {
            return this.userRepository.findById(id);
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse new expression', () => {
      const sourceCode = `
        class UserService {
          createUser(): User {
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse binary expression', () => {
      const sourceCode = `
        class UserService {
          isValid(id: number): boolean {
            return id > 0 && id < 100;
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse await expression', () => {
      const sourceCode = `
        class UserService {
          async getUser(id: number): Promise<User> {
            return await this.userRepository.findById(id);
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse object literal', () => {
      const sourceCode = `
        class UserService {
          getUserDto(): UserDto {
            return { id: 1, name: 'test' };
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse array literal', () => {
      const sourceCode = `
        class UserService {
          getAllUsers(): User[] {
            return [new User(), new User()];
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse property access expression', () => {
      const sourceCode = `
        class UserService {
          getUserName(): string {
            return this.user.name;
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse element access expression', () => {
      const sourceCode = `
        class UserService {
          getUser(index: number): User {
            return this.users[index];
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse conditional expression', () => {
      const sourceCode = `
        class UserService {
          getUser(id: number): User | null {
            return id > 0 ? new User() : null;
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(1);
      expect(classes[0].methods[0].body![0].type).toBe('return');
      expect(classes[0].methods[0].body![0].expression).toBeDefined();
    });

    test('should parse destructuring declaration', () => {
      const sourceCode = `
        class UserService {
          getUser(): User {
            const { id, name, email = '' } = this.user;
            return new User();
          }
        }
      `;

      const classes = parseSourceFile(sourceCode);
      expect(classes[0].methods[0].body).toHaveLength(2);
      expect(classes[0].methods[0].body![0].type).toBe('destructuring');
      expect(classes[0].methods[0].body![0].variables).toHaveLength(3);
      expect(classes[0].methods[0].body![0].variables[0].name).toBe('id');
      expect(classes[0].methods[0].body![0].variables[1].name).toBe('name');
      expect(classes[0].methods[0].body![0].variables[2].name).toBe('email');
      expect(classes[0].methods[0].body![0].variables[2].defaultValue).toBeDefined();
    });
  });
});
