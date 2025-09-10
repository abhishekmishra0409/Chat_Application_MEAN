import { Message } from './message.model';
import { User } from './user.model';

export interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  isGroup: boolean;
  participants: User[];
  admin?: User;
  avatar?: string;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}
