import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common'; // ⬅️ Import these

@Component({
  selector: 'app-create-chat-modal',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,     // ⬅️ Add here
    NgFor     // ⬅️ Add here
  ],
  templateUrl: './create-chat-modal.component.html',
  styleUrls: ['./create-chat-modal.component.css']
})
export class CreateChatModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  users: User[] = [];
  selectedUsers: string[] = [];
  chatName = '';
  isGroup = false;
  isLoading = false;
  searchQuery = '';

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data.users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  getUsernameById(userId: string): string {
  const user = this.users.find(u => u._id === userId);
  return user?.username || 'User';
}

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.includes(userId)) {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  createChat(): void {
    if (this.isGroup && !this.chatName) {
      alert('Group name is required');
      return;
    }

    if (this.selectedUsers.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    this.isLoading = true;

    const chatData = {
      name: this.chatName,
      participants: this.selectedUsers,
      isGroup: this.isGroup
    };

    this.chatService.createChatRoom(chatData).subscribe({
      next: () => {
        this.close.emit();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating chat:', error);
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
}
