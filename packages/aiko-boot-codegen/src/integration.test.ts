/**
 * Integration Tests
 * Tests for complete code generation workflow
 */
import { transpile } from './index.js';
import { generateJavaClass } from './generator.js';
import { parseSourceFile, parseSourceFileFull } from './parser.js';
import type { TranspilerOptions } from './types.js';

describe('Integration Tests', () => {
  describe('Complete Code Generation Workflow', () => {
    test('should generate complete entity class', () => {
      const sourceCode = `
        import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

        /**
         * User entity
         */
        @Entity
        class User {
          @TableId
          id: number;

          @TableField('user_name')
          name: string;

          @TableField('user_email')
          email: string;

          createdAt: Date;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('User.java')).toBe(true);

      const javaCode = result.get('User.java');
      expect(javaCode).toContain('package com.example.entity;');
      expect(javaCode).toContain('@TableName');
      expect(javaCode).toContain('@TableId');
      expect(javaCode).toContain('@TableField("user_name")');
      expect(javaCode).toContain('@TableField("user_email")');
      expect(javaCode).toContain('private Long id;');
      expect(javaCode).toContain('private String name;');
      expect(javaCode).toContain('private String email;');
      expect(javaCode).toContain('private LocalDateTime createdAt;');
    });

    test('should generate complete repository interface', () => {
      const sourceCode = `
        import { Repository } from '@ai-partner-x/aiko-boot-starter-orm';

        @Repository
        interface UserRepository {
          findById(id: number): User;
          findAll(): User[];
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.repository',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserRepository.java')).toBe(true);

      const javaCode = result.get('UserRepository.java');
      expect(javaCode).toContain('package com.example.repository;');
      expect(javaCode).toContain('@Repository');
      expect(javaCode).toContain('public interface UserRepository extends BaseMapper<User> {');
    });

    test('should generate complete service class', () => {
      const sourceCode = `
        import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';

        @Service
        class UserService {
          @Autowired
          private userRepository: UserRepository;

          @Transactional
          getUser(id: number): User {
            return this.userRepository.selectById(id);
          }

          @Transactional
          createUser(user: User): void {
            this.userRepository.insert(user);
          }

          getAllUsers(): User[] {
            return this.userRepository.selectList(null);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.service',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserService.java')).toBe(true);

      const javaCode = result.get('UserService.java');
      expect(javaCode).toContain('package com.example.service;');
      expect(javaCode).toContain('@Service');
      expect(javaCode).toContain('@Autowired');
      expect(javaCode).toContain('@Transactional');
      expect(javaCode).toContain('private UserRepository userRepository;');
      expect(javaCode).toContain('public User getUser(Long id)');
      expect(javaCode).toContain('public void createUser(User user)');
      expect(javaCode).toContain('public List<User> getAllUsers()');
    });

    test('should generate complete controller class', () => {
      const sourceCode = `
        import { RestController, Autowired, GetMapping, PostMapping, PutMapping, DeleteMapping, PathVariable, RequestBody, RequestParam } from '@ai-partner-x/aiko-boot';

        @RestController
        class UserController {
          @Autowired
          private userService: UserService;

          @GetMapping('/users/{id}')
          getUser(@PathVariable('id') id: number): User {
            return this.userService.getUser(id);
          }

          @GetMapping('/users')
          getUsers(@RequestParam('page') page: number): User[] {
            return this.userService.getAllUsers();
          }

          @PostMapping('/users')
          createUser(@RequestBody user: User): void {
            this.userService.createUser(user);
          }

          @PutMapping('/users/{id}')
          updateUser(@PathVariable('id') id: number, @RequestBody user: User): void {
            console.log(id, user);
          }

          @DeleteMapping('/users/{id}')
          deleteUser(@PathVariable('id') id: number): void {
            console.log(id);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.controller',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserController.java')).toBe(true);

      const javaCode = result.get('UserController.java');
      expect(javaCode).toContain('package com.example.controller;');
      expect(javaCode).toContain('@RestController');
      expect(javaCode).toContain('@Autowired');
      expect(javaCode).toContain('@GetMapping("/users/{id}")');
      expect(javaCode).toContain('@GetMapping("/users")');
      expect(javaCode).toContain('@PostMapping("/users")');
      expect(javaCode).toContain('@PutMapping("/users/{id}")');
      expect(javaCode).toContain('@DeleteMapping("/users/{id}")');
      expect(javaCode).toContain('@PathVariable("id")');
      expect(javaCode).toContain('@RequestBody');
      expect(javaCode).toContain('@RequestParam("page")');
    });

    test('should generate complete DTO class', () => {
      const sourceCode = `
        class UserDto {
          id: number;
          name: string;
          email?: string;
          age: number;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.dto',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserDto.java')).toBe(true);

      const javaCode = result.get('UserDto.java');
      expect(javaCode).toContain('package com.example.dto;');
      expect(javaCode).toContain('public class UserDto {');
      expect(javaCode).toContain('private Long id;');
      expect(javaCode).toContain('private String name;');
      expect(javaCode).toContain('private String email;');
      expect(javaCode).toContain('private Integer age;');
    });
  });

  describe('Redis Component Generation', () => {
    test('should generate Redis entity', () => {
      const sourceCode = `
        import { RedisHash, RedisKey, RedisValue, Indexed } from '@ai-partner-x/aiko-boot-starter-redis';

        @RedisHash('userSession')
        class UserSession {
          @RedisKey
          @Id
          id: string;

          @Indexed
          userId: number;

          @RedisValue
          data: string;

          createdAt: Date;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserSession.java')).toBe(true);

      const javaCode = result.get('UserSession.java');
      expect(javaCode).toContain('package com.example.entity;');
      expect(javaCode).toContain('@RedisHash("userSession")');
      expect(javaCode).toContain('@Id');
      expect(javaCode).toContain('@Indexed');
      expect(javaCode).toContain('private String id;');
      expect(javaCode).toContain('private Integer userId;');
      expect(javaCode).toContain('private String data;');
      expect(javaCode).toContain('private LocalDateTime createdAt;');
    });

    test('should generate Redis repository', () => {
      const sourceCode = `
        import { RedisRepository } from '@ai-partner-x/aiko-boot-starter-redis';

        @RedisRepository
        interface UserSessionRepository {
          findById(id: string): UserSession;
          save(session: UserSession): void;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.repository',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('UserSessionRepository.java')).toBe(true);

      const javaCode = result.get('UserSessionRepository.java');
      expect(javaCode).toContain('package com.example.repository;');
      expect(javaCode).toContain('@Repository');
      expect(javaCode).toContain('public interface UserSessionRepository extends RedisRepository<UserSession, String> {');
    });
  });

  describe('Message Queue Component Generation', () => {
    test('should generate MQ listener service', () => {
      const sourceCode = `
        import { EnableBinding, StreamListener } from '@ai-partner-x/aiko-boot-starter-mq';

        @EnableBinding
        class OrderService {
          @StreamListener(Sink.INPUT)
          handleOrder(order: Order): void {
            console.log(order);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.service',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('OrderService.java')).toBe(true);

      const javaCode = result.get('OrderService.java');
      expect(javaCode).toContain('package com.example.service;');
      expect(javaCode).toContain('@EnableBinding');
      expect(javaCode).toContain('@StreamListener(Sink.INPUT)');
      expect(javaCode).toContain('public void handleOrder(Order order)');
    });

    test('should generate MQ sender service', () => {
      const sourceCode = `
        import { EnableBinding, Output } from '@ai-partner-x/aiko-boot-starter-mq';

        @EnableBinding
        class OrderProducer {
          @Output(Source.OUTPUT)
          sendOrder(order: Order): void {
            console.log(order);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.service',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('OrderProducer.java')).toBe(true);

      const javaCode = result.get('OrderProducer.java');
      expect(javaCode).toContain('package com.example.service;');
      expect(javaCode).toContain('@EnableBinding');
      expect(javaCode).toContain('@Output(Source.OUTPUT)');
      expect(javaCode).toContain('public void sendOrder(Order order)');
    });
  });

  describe('Security Component Generation', () => {
    test('should generate security service', () => {
      const sourceCode = `
        import { Service, PreAuthorize, PostAuthorize, EnableGlobalMethodSecurity } from '@ai-partner-x/aiko-boot-starter-security';

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

      const options: TranspilerOptions = {
        packageName: 'com.example.service',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(1);
      expect(result.has('AdminService.java')).toBe(true);

      const javaCode = result.get('AdminService.java');
      expect(javaCode).toContain('package com.example.service;');
      expect(javaCode).toContain('@EnableGlobalMethodSecurity');
      expect(javaCode).toContain('@PreAuthorize("hasRole(\\"ADMIN\\")")');
      expect(javaCode).toContain('@PostAuthorize("returnObject.owner == authentication.name")');
      expect(javaCode).toContain('public void deleteUser(Long id)');
      expect(javaCode).toContain('public Document getDocument(Long id)');
    });
  });

  describe('Complex Scenario Tests', () => {
    test('should generate complete CRUD application', () => {
      const entityCode = `
        import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

        @Entity
        class Product {
          @TableId
          id: number;

          @TableField('product_name')
          name: string;

          @TableField('product_price')
          price: number;

          @TableField('product_description')
          description?: string;

          createdAt: Date;
        }
      `;

      const repositoryCode = `
        import { Repository } from '@ai-partner-x/aiko-boot-starter-orm';

        @Repository
        interface ProductRepository {
          findById(id: number): Product;
          findAll(): Product[];
          save(product: Product): void;
          deleteById(id: number): void;
        }
      `;

      const serviceCode = `
        import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';

        @Service
        class ProductService {
          @Autowired
          private productRepository: ProductRepository;

          @Transactional
          getProduct(id: number): Product {
            return this.productRepository.selectById(id);
          }

          @Transactional
          getAllProducts(): Product[] {
            return this.productRepository.selectList(null);
          }

          @Transactional
          createProduct(product: Product): void {
            this.productRepository.insert(product);
          }

          @Transactional
          updateProduct(product: Product): void {
            this.productRepository.updateById(product);
          }

          @Transactional
          deleteProduct(id: number): void {
            this.productRepository.deleteById(id);
          }
        }
      `;

      const controllerCode = `
        import { RestController, Autowired, GetMapping, PostMapping, PutMapping, DeleteMapping, PathVariable, RequestBody } from '@ai-partner-x/aiko-boot';

        @RestController
        class ProductController {
          @Autowired
          private productService: ProductService;

          @GetMapping('/products/{id}')
          getProduct(@PathVariable('id') id: number): Product {
            return this.productService.getProduct(id);
          }

          @GetMapping('/products')
          getAllProducts(): Product[] {
            return this.productService.getAllProducts();
          }

          @PostMapping('/products')
          createProduct(@RequestBody product: Product): void {
            this.productService.createProduct(product);
          }

          @PutMapping('/products/{id}')
          updateProduct(@PathVariable('id') id: number, @RequestBody product: Product): void {
            this.productService.updateProduct(product);
          }

          @DeleteMapping('/products/{id}')
          deleteProduct(@PathVariable('id') id: number): void {
            this.productService.deleteProduct(id);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example',
      };

      const entityResult = transpile(entityCode, { ...options, packageName: 'com.example.entity' });
      const repositoryResult = transpile(repositoryCode, { ...options, packageName: 'com.example.repository' });
      const serviceResult = transpile(serviceCode, { ...options, packageName: 'com.example.service' });
      const controllerResult = transpile(controllerCode, { ...options, packageName: 'com.example.controller' });

      expect(entityResult.size).toBe(1);
      expect(repositoryResult.size).toBe(1);
      expect(serviceResult.size).toBe(1);
      expect(controllerResult.size).toBe(1);

      expect(entityResult.has('Product.java')).toBe(true);
      expect(repositoryResult.has('ProductRepository.java')).toBe(true);
      expect(serviceResult.has('ProductService.java')).toBe(true);
      expect(controllerResult.has('ProductController.java')).toBe(true);

      const entityJava = entityResult.get('Product.java');
      expect(entityJava).toContain('package com.example.entity;');
      expect(entityJava).toContain('@TableName');
      expect(entityJava).toContain('private Long id;');
      expect(entityJava).toContain('private String name;');
      expect(entityJava).toContain('private Integer price;');
      expect(entityJava).toContain('private String description;');
      expect(entityJava).toContain('private LocalDateTime createdAt;');

      const repositoryJava = repositoryResult.get('ProductRepository.java');
      expect(repositoryJava).toContain('package com.example.repository;');
      expect(repositoryJava).toContain('public interface ProductRepository extends BaseMapper<Product> {');

      const serviceJava = serviceResult.get('ProductService.java');
      expect(serviceJava).toContain('package com.example.service;');
      expect(serviceJava).toContain('@Service');
      expect(serviceJava).toContain('@Autowired');
      expect(serviceJava).toContain('@Transactional');

      const controllerJava = controllerResult.get('ProductController.java');
      expect(controllerJava).toContain('package com.example.controller;');
      expect(controllerJava).toContain('@RestController');
      expect(controllerJava).toContain('@GetMapping');
      expect(controllerJava).toContain('@PostMapping');
      expect(controllerJava).toContain('@PutMapping');
      expect(controllerJava).toContain('@DeleteMapping');
    });

    test('should handle multiple classes in single file', () => {
      const sourceCode = `
        import { Entity, TableId } from '@ai-partner-x/aiko-boot-starter-orm';

        @Entity
        class User {
          @TableId
          id: number;
          name: string;
        }

        @Entity
        class Product {
          @TableId
          id: number;
          name: string;
          price: number;
        }

        @Entity
        class Order {
          @TableId
          id: number;
          userId: number;
          productId: number;
          quantity: number;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(3);
      expect(result.has('User.java')).toBe(true);
      expect(result.has('Product.java')).toBe(true);
      expect(result.has('Order.java')).toBe(true);

      const userJava = result.get('User.java');
      expect(userJava).toContain('package com.example.entity;');
      expect(userJava).toContain('public class User {');

      const productJava = result.get('Product.java');
      expect(productJava).toContain('package com.example.entity;');
      expect(productJava).toContain('public class Product {');

      const orderJava = result.get('Order.java');
      expect(orderJava).toContain('package com.example.entity;');
      expect(orderJava).toContain('public class Order {');
    });
  });

  describe('Error Handling', () => {
    test('should handle syntax errors gracefully', () => {
      const sourceCode = `
        @Entity
        class User {
          @TableId
          id: number
          name: string;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      expect(() => transpile(sourceCode, options)).not.toThrow();
    });

    test('should handle empty file', () => {
      const sourceCode = '';
      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(0);
    });

    test('should handle file with only imports', () => {
      const sourceCode = `
        import { Entity, TableId } from '@ai-partner-x/aiko-boot-starter-orm';
        import { Service } from '@ai-partner-x/aiko-boot';
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      expect(result.size).toBe(0);
    });
  });

  describe('Import Collection', () => {
    test('should collect imports correctly for entity', () => {
      const sourceCode = `
        import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';
        import { LocalDateTime } from 'java.time';

        @Entity
        class User {
          @TableId
          id: number;
          name: string;
          createdAt: Date;
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.entity',
      };

      const result = transpile(sourceCode, options);
      const javaCode = result.get('User.java');

      expect(javaCode).toContain('import com.baomidou.mybatisplus.annotation.*;');
      expect(javaCode).toContain('import java.time.LocalDateTime;');
    });

    test('should collect imports correctly for service', () => {
      const sourceCode = `
        import { Service, Autowired, Transactional } from '@ai-partner-x/aiko-boot';
        import { QueryWrapper } from '@ai-partner-x/aiko-boot-starter-orm';

        @Service
        class UserService {
          @Autowired
          private userRepository: UserRepository;

          @Transactional
          getUser(id: number): User {
            return this.userRepository.selectById(id);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.service',
      };

      const result = transpile(sourceCode, options);
      const javaCode = result.get('UserService.java');

      expect(javaCode).toContain('import org.springframework.stereotype.Service;');
      expect(javaCode).toContain('import org.springframework.beans.factory.annotation.Autowired;');
      expect(javaCode).toContain('import org.springframework.transaction.annotation.Transactional;');
      expect(javaCode).toContain('import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;');
    });

    test('should collect imports correctly for controller', () => {
      const sourceCode = `
        import { RestController, Autowired, GetMapping, PathVariable, RequestBody } from '@ai-partner-x/aiko-boot';

        @RestController
        class UserController {
          @Autowired
          private userService: UserService;

          @GetMapping('/users/{id}')
          getUser(@PathVariable('id') id: number): User {
            return this.userService.getUser(id);
          }

          @PostMapping('/users')
          createUser(@RequestBody user: User): void {
            this.userService.createUser(user);
          }
        }
      `;

      const options: TranspilerOptions = {
        packageName: 'com.example.controller',
      };

      const result = transpile(sourceCode, options);
      const javaCode = result.get('UserController.java');

      expect(javaCode).toContain('import org.springframework.web.bind.annotation.RestController;');
      expect(javaCode).toContain('import org.springframework.web.bind.annotation.GetMapping;');
      expect(javaCode).toContain('import org.springframework.web.bind.annotation.PostMapping;');
      expect(javaCode).toContain('import org.springframework.web.bind.annotation.PathVariable;');
      expect(javaCode).toContain('import org.springframework.web.bind.annotation.RequestBody;');
    });
  });
});
