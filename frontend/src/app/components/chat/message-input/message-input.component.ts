import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Subject } from 'rxjs';
import {FormsModule} from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  styleUrls: ['./message-input.component.css']
})
export class MessageInputComponent implements OnDestroy {
  @Input() chatRoomId: string = '';
  @Output() sendMessage = new EventEmitter<string>();
  @Output() startTyping = new EventEmitter<void>();
  @Output() stopTyping = new EventEmitter<void>();

  message = '';
  private typingSubject = new Subject<void>();
  private typingSubscription: Subscription;
  private isTyping = false;

  constructor() {
    this.typingSubscription = this.typingSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(() => {
      this.stopTyping.emit();
      this.isTyping = false;
    });
  }

  onInput(): void {
    if (!this.isTyping) {
      this.startTyping.emit();
      this.isTyping = true;
    }
    this.typingSubject.next();
  }

  onSubmit(): void {
    if (this.message.trim()) {
      this.sendMessage.emit(this.message.trim());
      this.message = '';
      this.stopTyping.emit();
      this.isTyping = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  ngOnDestroy(): void {
    this.typingSubscription.unsubscribe();
  }
}
