import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../services/chat.service';
import { SocketService } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { ChatRoom } from '../../../models/chat-room.model';
import { CreateChatModalComponent } from '../create-chat-modal/create-chat-modal.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateChatModalComponent],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnInit, OnDestroy {
  chatRooms: ChatRoom[] = [];
  isLoading = true;
  showCreateModal = false;
  searchQuery = '';
  currentUser: any;
  isMobile = false;
  activePanel: 'chats' | 'profile' | 'main' = 'main';

  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService,
    private chatService: ChatService,
    private socketService: SocketService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.checkMobile();
    this.loadChatRooms();
    this.setupSocketListeners();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 1024; // lg breakpoint
    if (!this.isMobile) {
      this.activePanel = 'main';
    }
  }

  loadChatRooms(): void {
    this.chatService.getChatRooms().subscribe({
      next: (response) => {
        this.chatRooms = response.data.chatRooms;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading chat rooms:', error);
        this.isLoading = false;
      }
    });
  }

  setupSocketListeners(): void {
    this.subscriptions.push(
      this.socketService.onNewChatRoom().subscribe(({ chatRoom }) => {
        this.chatRooms.unshift(chatRoom);
      })
    );
  }

  openChat(chatRoomId: string): void {
    this.router.navigate(['/chat', chatRoomId]);
    // Close panels on mobile after selection
    if (this.isMobile) {
      this.activePanel = 'main';
    }
  }

  editProfile(): void {
    this.router.navigate(['/profile']);
    // Close panel on mobile after navigation
    if (this.isMobile) {
      this.activePanel = 'main';
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getOtherParticipant(chatRoom: ChatRoom): string {
    if (!chatRoom.isGroup && chatRoom.participants) {
      const otherParticipant = chatRoom.participants.find(
        participant => participant._id !== this.currentUser?._id
      );
      return otherParticipant?.username || 'Unknown';
    }
    return chatRoom.name || 'Group';
  }

  getLastMessagePreview(chatRoom: ChatRoom): string {
    if (!chatRoom.lastMessage) return 'No messages yet';

    const message = chatRoom.lastMessage.content;
    return message.length > 30 ? message.substring(0, 30) + '...' : message;
  }

  getFilteredChatRooms(): ChatRoom[] {
    if (!this.searchQuery) return this.chatRooms;

    return this.chatRooms.filter(chatRoom =>
      this.getOtherParticipant(chatRoom).toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      this.getLastMessagePreview(chatRoom).toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
