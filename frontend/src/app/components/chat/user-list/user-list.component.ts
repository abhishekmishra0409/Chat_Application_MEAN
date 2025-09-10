import { Component, Input, OnInit } from '@angular/core';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {UserAvatarComponent} from '../../shared/user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    UserAvatarComponent,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  @Input() chatRoomId: string = '';
  users: User[] = [];
  isLoading = true;
  searchQuery = '';
  user: any;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data.users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  getFilteredUsers(): User[] {
    if (!this.searchQuery) return this.users;

    return this.users.filter(user =>
      user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  getStatusColor(isOnline: boolean): string {
    return isOnline ? 'bg-green-400' : 'bg-gray-400';
  }
}
