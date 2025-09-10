import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from '../../../models/message.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import {UserAvatarComponent} from '../../shared/user-avatar/user-avatar.component';
import {DatePipe, NgFor, NgIf} from '@angular/common';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  standalone: true,
  imports: [
    UserAvatarComponent,
    DatePipe,
    NgFor,
    NgIf
  ],
  styleUrls: ['./message-list.component.css']
})
export class MessageListComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() typingUsers: string[] = [];
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private subscriptions: Subscription[] = [];
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  isCurrentUser(message: Message): boolean {
    return message.sender._id === this.currentUser?._id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message._id;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
