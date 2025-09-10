import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRoom } from '../models/chat-room.model';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getChatRooms(): Observable<{ status: string; data: { chatRooms: ChatRoom[] } }> {
    return this.http.get<{ status: string; data: { chatRooms: ChatRoom[] } }>(
      `${this.apiUrl}/chatrooms`,
      { headers: this.getAuthHeaders() }
    );
  }

  getChatRoom(chatRoomId: string): Observable<{ status: string; data: { chatRoom: ChatRoom } }> {
    return this.http.get<{ status: string; data: { chatRoom: ChatRoom } }>(
      `${this.apiUrl}/chatrooms/${chatRoomId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  createChatRoom(chatRoomData: any): Observable<{ status: string; data: { chatRoom: ChatRoom } }> {
    return this.http.post<{ status: string; data: { chatRoom: ChatRoom } }>(
      `${this.apiUrl}/chatrooms`,
      chatRoomData,
      { headers: this.getAuthHeaders() }
    );
  }

  getMessages(chatRoomId: string, page: number = 1, limit: number = 50): Observable<{ status: string; data: { messages: Message[] } }> {
    return this.http.get<{ status: string; data: { messages: Message[] } }>(
      `${this.apiUrl}/messages/${chatRoomId}?page=${page}&limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
  }

  sendMessage(messageData: any): Observable<{ status: string; data: { message: Message } }> {
    return this.http.post<{ status: string; data: { message: Message } }>(
      `${this.apiUrl}/messages`,
      messageData,
      { headers: this.getAuthHeaders() }
    );
  }

  searchUsers(query: string): Observable<{ status: string; data: { users: User[] } }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/users/search?q=${query}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
