import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../services/chat.service';
import { SocketService } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { ChatRoom } from '../../../models/chat-room.model';
import { Message } from '../../../models/message.model';
import { User } from '../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    DatePipe
  ],
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  chatRoomId: string = '';
  messages: Message[] = [];
  newMessage = '';
  chatRoom?: ChatRoom;
  isLoading = false;
  isTyping = false;
  typingUsers: string[] = [];
  chatRooms: ChatRoom[] = [];
  showChatList = true;
  searchQuery = '';
  isMobile = false;
  showProfileModal = false;
  selectedUser: User | null = null;
  selectedChatRoom: ChatRoom | null = null;
  private shouldScrollToBottom = true;

  private subscriptions: Subscription[] = [];
  currentUser: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // console.log(this.currentUser);

    this.chatRoomId = this.route.snapshot.paramMap.get('id') || '';
    this.checkMobile();

    this.loadChatRooms();
    this.loadChatRoom();
    this.loadMessages();
    this.setupSocketListeners();

    // console.log(this.loadChatRoom());


    this.socketService.joinChatRoom(this.chatRoomId);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.showChatList = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        setTimeout(() => {
          this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }, 100);
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Add back to chat list function
  goBackToChatList(): void {
    this.router.navigate(['/chat']);
  }

  loadChatRooms(): void {
    this.chatService.getChatRooms().subscribe({
      next: (response) => {
        this.chatRooms = response.data.chatRooms;
      },
      error: (error) => {
        console.error('Error loading chat rooms:', error);
      }
    });
  }

  loadChatRoom(): void {
    this.chatService.getChatRoom(this.chatRoomId).subscribe({
      next: (response) => {
        this.chatRoom = response.data.chatRoom;
        // console.log(this.chatRoom);
      },
      error: (error) => {
        console.error('Error loading chat room:', error);
      }
    });
  }

  loadMessages(): void {
    this.isLoading = true;
    this.chatService.getMessages(this.chatRoomId).subscribe({
      next: (response) => {
        this.messages = response.data.messages;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading = false;
      }
    });
  }

  setupSocketListeners(): void {
    // Message listeners
    this.subscriptions.push(
      this.socketService.onReceiveMessage().subscribe((message: Message) => {
        if (message.chatRoom === this.chatRoomId) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      })
    );

    // Typing listeners - FIXED: filter by username instead of userId
    this.subscriptions.push(
      this.socketService.onUserTyping().subscribe((data) => {
        if (!this.typingUsers.includes(data.username)) {
          this.typingUsers.push(data.username);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.onUserStopTyping().subscribe((data) => {
        this.typingUsers = this.typingUsers.filter(user => user !== data.userId); // FIXED: filter by username
      })
    );

    // New chat room listener
    this.subscriptions.push(
      this.socketService.onNewChatRoom().subscribe(({ chatRoom }) => {
        this.chatRooms.unshift(chatRoom);
      })
    );
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageData = {
        content: this.newMessage,
        chatRoomId: this.chatRoomId
      };

      this.socketService.sendMessage(messageData);
      this.newMessage = '';
      this.socketService.stopTyping(this.chatRoomId);
      this.shouldScrollToBottom = true;
    }
  }

  onTyping(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.socketService.startTyping(this.chatRoomId);

      setTimeout(() => {
        this.isTyping = false;
        this.socketService.stopTyping(this.chatRoomId);
      }, 1000);
    }
  }

  openChat(chatRoomId: string): void {
    if (chatRoomId !== this.chatRoomId) {
      this.router.navigate(['/chat', chatRoomId]);
      this.chatRoomId = chatRoomId;
      this.loadChatRoom();
      this.loadMessages();

      // Leave current room and join new one
      this.socketService.leaveChatRoom(this.chatRoomId);
      this.socketService.joinChatRoom(chatRoomId);
    }

    // Hide sidebar on mobile after selection
    if (this.isMobile) {
      this.showChatList = false;
    }
  }

  showUserProfile(user: User): void {
    this.selectedUser = user;
    this.selectedChatRoom = null;
    this.showProfileModal = true;
  }

  showChatRoomProfile(chatRoom: ChatRoom): void {
    this.selectedChatRoom = chatRoom;
    this.selectedUser = null;
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.selectedUser = null;
    this.selectedChatRoom = null;
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

    // Handle both string and object types for lastMessage content
    const message = typeof chatRoom.lastMessage === 'object'
      ? chatRoom.lastMessage.content
      : chatRoom.lastMessage;

    return message.length > 30 ? message.substring(0, 30) + '...' : message;
  }

  getFilteredChatRooms(): ChatRoom[] {
    if (!this.searchQuery) return this.chatRooms;

    return this.chatRooms.filter(chatRoom =>
      this.getOtherParticipant(chatRoom).toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      this.getLastMessagePreview(chatRoom).toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleChatList(): void {
    this.showChatList = !this.showChatList;
  }

  isActiveChat(chatRoomId: string): boolean {
    return chatRoomId === this.chatRoomId;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.leaveChatRoom(this.chatRoomId);
  }
}
