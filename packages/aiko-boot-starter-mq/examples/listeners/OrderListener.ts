import { MqListener } from '@ai-partner-x/aiko-boot-starter-mq';

export interface OrderPaidEvent {
  orderId: string;
  amount: number;
}

export class OrderListener {
  @MqListener({ topic: 'order.paid', tag: 'pay', group: 'order-group' })
  async onOrderPaid(event: OrderPaidEvent): Promise<void> {
    console.log('[Consumer] order.paid:', event);
  }
}
