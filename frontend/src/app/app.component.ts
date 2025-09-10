import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';
import { RouterOutlet } from '@angular/router';
import {UserProfileComponent} from './components/shared/user-profile/user-profile.component';   // ✅ import this

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Chat App';

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      // Socket connection is automatically established in SocketService
    }
  }

  logout(): void {
    this.authService.logout();
    this.socketService.disconnect();
  }
}
