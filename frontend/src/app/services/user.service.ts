import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ✅ Get all users
  getUsers(): Observable<{ status: string; data: { users: User[] } }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/users`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Search users
  searchUsers(query: string): Observable<{ status: string; data: { users: User[] } }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/users/search?q=${query}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Get current user profile
  getCurrentUser(): Observable<{ status: string; data: { user: User } }> {
    return this.http.get<{ status: string; data: { user: User } }>(
      `${this.apiUrl}/users/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Get chat partners
  getChatPartners(): Observable<{ status: string; data: { users: User[] } }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/users/chat-partners`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Get user stats
  getUserStats(): Observable<{ status: string; data: any }> {
    return this.http.get<{ status: string; data: any }>(
      `${this.apiUrl}/users/stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Get user by ID
  getUserById(userId: string): Observable<{ status: string; data: { user: User } }> {
    return this.http.get<{ status: string; data: { user: User } }>(
      `${this.apiUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Update user profile (use PUT not PATCH)
  updateUser(userId: string, userData: any): Observable<{ status: string; data: { user: User } }> {
    return this.http.put<{ status: string; data: { user: User } }>(
      `${this.apiUrl}/users/${userId}`,
      userData,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Update online status
  updateOnlineStatus(isOnline: boolean): Observable<{ status: string; data: { user: User } }> {
    return this.http.patch<{ status: string; data: { user: User } }>(
      `${this.apiUrl}/users/online-status`,
      { isOnline },
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Upload avatar
  uploadAvatar(file: File): Observable<{ status: string; data: { user: User } }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ status: string; data: { user: User } }>(
      `${this.apiUrl}/users/upload-avatar`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Change password
  changePassword(currentPassword: string, newPassword: string): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ Delete user
  deleteUser(userId: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
