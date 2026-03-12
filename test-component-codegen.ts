/**
 * Test file for component code generation
 * This file demonstrates the usage of new components (Redis, MQ, Security, Admin)
 */

// ==================== Redis Component ====================

/**
 * Redis hash entity
 */
@RedisHash('user-session')
export class UserSession {
  @Id()
  id: string;
  
  @Indexed()
  userId: string;
  
  data: string;
  
  @Indexed()
  createdAt: Date;
}

/**
 * Redis repository
 */
@RedisRepository(UserSession)
export interface UserSessionRepository {
  findByUserId(userId: string): UserSession[];
  deleteByUserId(userId: string): void;
}

// ==================== Message Queue Component ====================

/**
 * Message queue binding
 */
@MqBinding(Source)
export class OrderMessageProducer {
  @MqSender('output')
  private messageSender: MessageChannel;
  
  sendOrderMessage(order: Order) {
    this.messageSender.send(MessageBuilder.withPayload(order).build());
  }
}

/**
 * Message queue listener
 */
@MqBinding(Sink)
export class OrderMessageConsumer {
  @MqListener('input')
  handleOrderMessage(order: Order) {
    console.log('Received order:', order);
  }
}

// ==================== Security Component ====================

/**
 * Security configuration
 */
@EnableGlobalMethodSecurity({
  prePostEnabled: true,
  securedEnabled: true,
  jsr250Enabled: true
})
export class SecurityConfig {
}

/**
 * Secure service
 */
export class UserService {
  @PreAuthorize('hasRole("ADMIN")')
  adminOnlyMethod() {
    return 'Admin only';
  }
  
  @Secured(['ROLE_USER'])
  userOnlyMethod() {
    return 'User only';
  }
  
  @RolesAllowed(['ROLE_USER', 'ROLE_ADMIN'])
  bothRolesMethod() {
    return 'Both roles';
  }
  
  getUserInfo(@AuthenticationPrincipal user: User) {
    return user;
  }
}

// ==================== Admin Component ====================

/**
 * Admin module
 */
@AdminModule()
export class AdminModuleConfig {
}

/**
 * Admin controller
 */
@RestController('/admin')
export class AdminController {
  @GetMapping('/dashboard')
  @AdminRoute()
  @AdminMenu({ name: 'Dashboard', icon: 'dashboard' })
  @PreAuthorize('hasRole("ADMIN")')
  getDashboard() {
    return { status: 'ok' };
  }
  
  @GetMapping('/users')
  @AdminRoute()
  @AdminMenu({ name: 'Users', icon: 'users' })
  @PreAuthorize('hasRole("ADMIN")')
  getUsers() {
    return [];
  }
}

// ==================== DTOs and Entities ====================

export class Order {
  id: string;
  userId: string;
  amount: number;
  status: string;
}

export class User {
  id: string;
  username: string;
  roles: string[];
}
