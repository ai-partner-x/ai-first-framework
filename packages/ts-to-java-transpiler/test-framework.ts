// Redis entity example
@RedisHash('userSessions')
export class UserSession {
  @HashKey
  id: string;
  userId: number;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

// Redis repository example
export interface UserSessionRepository {
  findByUserId(userId: number): UserSession[];
  deleteByExpiresAtBefore(date: Date): void;
}

// MQ producer example
export class OrderMessageProducer {
  @Output('orderOutput')
  private orderOutput: any;

  sendOrderMessage(orderId: number, status: string): void {
    const message = { orderId, status, timestamp: new Date() };
    this.orderOutput.send(message);
  }
}

// MQ consumer example
export class OrderMessageConsumer {
  @MqListener('orderInput')
  handleOrderMessage(message: any): void {
    console.log('Received order message:', message);
    // Process message
  }
}

// Security example
export class UserController {
  @PreAuthorize('hasRole("ADMIN")')
  getUsers(): any[] {
    return [];
  }

  @Secured('ROLE_USER')
  getUserById(id: number): any {
    return { id, name: 'John' };
  }

  @PostAuthorize('returnObject.owner == authentication.name')
  getOrder(id: number): any {
    return { id, owner: 'user123' };
  }
}
