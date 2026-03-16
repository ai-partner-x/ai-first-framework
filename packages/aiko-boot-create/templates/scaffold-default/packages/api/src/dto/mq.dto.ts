/**
 * MQ 消息 DTO（复用 User 实体字段，不包含敏感信息）
 */
export interface UserEventDto {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendUserEventDto {
  topic: string;
  tag?: string;
  body: UserEventDto;
}
