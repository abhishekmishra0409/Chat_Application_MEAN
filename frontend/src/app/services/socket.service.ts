import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Message } from '../models/message.model';
import { ChatRoom } from '../models/chat-room.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private isConnected = false;

  constructor(private authService: AuthService) {
    this.socket = io('http://localhost:5000', {
      auth: {
        token: this.authService.getToken()
      }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from server');
    });
  }

  // Message events
  sendMessage(messageData: any): void {
    this.socket.emit('send_message', messageData);
  }

  onReceiveMessage(): Observable<Message> {
    return new Observable<Message>(observer => {
      this.socket.on('receive_message', (message: Message) => {
        observer.next(message);
      });
    });
  }

  onMessageSent(): Observable<Message> {
    return new Observable<Message>(observer => {
      this.socket.on('message_sent', (message: Message) => {
        observer.next(message);
      });
    });
  }

  // Typing events
  startTyping(chatRoomId: string): void {
    this.socket.emit('typing_start', { chatRoomId });
  }

  stopTyping(chatRoomId: string): void {
    this.socket.emit('typing_stop', { chatRoomId });
  }

  onUserTyping(): Observable<{ userId: string; username: string }> {
    return new Observable(observer => {
      this.socket.on('user_typing', (data: { userId: string; username: string }) => {
        observer.next(data);
      });
    });
  }

  onUserStopTyping(): Observable<{ userId: string }> {
  return new Observable(observer => {
    this.socket.on('user_stop_typing', (data: { userId: string }) => {
      observer.next(data);
    });
  });
}


  // Chat room events
  createChatRoom(chatRoomData: any): void {
    this.socket.emit('create_chat_room', chatRoomData);
  }

  onChatRoomCreated(): Observable<{ chatRoom: ChatRoom }> {
    return new Observable(observer => {
      this.socket.on('chat_room_created', (data: { chatRoom: ChatRoom }) => {
        observer.next(data);
      });
    });
  }

  onNewChatRoom(): Observable<{ chatRoom: ChatRoom }> {
    return new Observable(observer => {
      this.socket.on('new_chat_room', (data: { chatRoom: ChatRoom }) => {
        observer.next(data);
      });
    });
  }

  joinChatRoom(chatRoomId: string): void {
    this.socket.emit('join_chat_room', chatRoomId);
  }

  leaveChatRoom(chatRoomId: string): void {
    this.socket.emit('leave_chat_room', chatRoomId);
  }

  onUserJoined(): Observable<{ userId: string; username: string }> {
    return new Observable(observer => {
      this.socket.on('user_joined', (data: { userId: string; username: string }) => {
        observer.next(data);
      });
    });
  }

  onUserLeft(): Observable<{ userId: string; username: string }> {
    return new Observable(observer => {
      this.socket.on('user_left', (data: { userId: string; username: string }) => {
        observer.next(data);
      });
    });
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
