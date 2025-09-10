import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import {FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  isEditing = false;
  editedUser: any = {};
  error = '';
  success = '';
  isUpdating = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        this.user = response.data.user;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  startEditing(): void {
    this.isEditing = true;
    this.editedUser = {
      username: this.user?.username || '',
      email: this.user?.email || ''
    };
    this.error = '';
    this.success = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editedUser = {};
    this.error = '';
    this.success = '';
  }

  saveProfile(): void {
    if (!this.user) return;

    // Validate inputs
    if (!this.editedUser.username || !this.editedUser.email) {
      this.error = 'Username and email are required';
      return;
    }

    if (!this.isValidEmail(this.editedUser.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.isUpdating = true;
    this.error = '';
    this.success = '';

    this.userService.updateUser(this.user._id, this.editedUser).subscribe({
      next: (response) => {
        this.user = response.data.user;
        // this.authService.updateCurrentUser(this.user);
        this.isEditing = false;
        this.isUpdating = false;
        this.editedUser = {};
        this.success = 'Profile updated successfully!';

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        this.isUpdating = false;
        this.error = error.error?.message || 'Failed to update profile. Please try again.';
        console.error('Profile update error:', error);
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }

  // Add method to handle avatar upload if needed
  onAvatarUploaded(avatarUrl: string): void {
    if (this.user) {
      this.user.avatar = avatarUrl;
      // this.authService.updateCurrentUser(this.user);
    }
  }
}
