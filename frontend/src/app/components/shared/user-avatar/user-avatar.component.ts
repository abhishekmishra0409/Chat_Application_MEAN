import { Component, Input } from '@angular/core';
import { User } from '../../../models/user.model';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  standalone: true,
  imports: [
    NgClass,
    NgIf
  ],
  styleUrls: ['./user-avatar.component.css']
})
export class UserAvatarComponent {
  @Input() user: User | null = null;
  @Input() size: number = 8;
  @Input() showStatus: boolean = false;
  @Input() statusSize: number = 3;

  getInitials(): string {
    if (!this.user?.username) return '?';
    return this.user.username.charAt(0).toUpperCase();
  }

  getSizeClass(): string {
    return `w-${this.size} h-${this.size}`;
  }

  getStatusSizeClass(): string {
    return `w-${this.statusSize} h-${this.statusSize}`;
  }

  getStatusColor(): string {
    return this.user?.isOnline ? 'bg-green-400' : 'bg-gray-400';
  }
}
