import { MqListener } from '@ai-partner-x/aiko-boot-starter-mq';

export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
}

export class UserCreatedListener {
  @MqListener({ topic: 'user.created', tag: 'add', group: 'user-group' })
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    console.log('[Consumer] user.created:', event);
  }
}
