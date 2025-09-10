import { User } from './user.model';


export interface Message {
  _id: string;
  content: string;
  sender: User;
  receiver?: User;
  chatRoom?: string;
  messageType: 'text' | 'image' | 'file' | 'video';
  fileUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
