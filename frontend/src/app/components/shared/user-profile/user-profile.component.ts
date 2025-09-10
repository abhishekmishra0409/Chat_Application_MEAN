import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  @Output() profileClicked = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  currentUser: User | null = null;
  showDropdown = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        this.currentUser = response.data.user;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.isLoading = false;
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  onProfileClick(): void {
    this.showDropdown = false;
    this.profileClicked.emit();
    this.router.navigate(['/profile']);
  }

  onSettingsClick(): void {
    this.showDropdown = false;
    this.settingsClicked.emit();
    this.router.navigate(['/settings']);
  }

  onLogoutClick(): void {
    this.showDropdown = false;
    this.logoutClicked.emit();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }
}
