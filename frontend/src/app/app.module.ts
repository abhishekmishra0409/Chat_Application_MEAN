import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChatRoomComponent } from './components/chat/chat-room/chat-room.component';
import { ChatListComponent } from './components/chat/chat-list/chat-list.component';
import { CreateChatModalComponent } from './components/chat/create-chat-modal/create-chat-modal.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { UserAvatarComponent } from './components/shared/user-avatar/user-avatar.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { MessageListComponent } from './components/chat/message-list/message-list.component';
import { MessageInputComponent } from './components/chat/message-input/message-input.component';
import { UserListComponent } from './components/chat/user-list/user-list.component';
import { UserProfileComponent } from './components/shared/user-profile/user-profile.component';
import { ProfileComponent } from './components/shared/profile/profile.component';

@NgModule({
  declarations: [
     AppComponent,
    LoginComponent,
    RegisterComponent,
    ChatRoomComponent,
    ChatListComponent,
    CreateChatModalComponent,
    MessageListComponent,
    MessageInputComponent,
    UserListComponent,
    // UserSearchComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    UserAvatarComponent,
    UserProfileComponent
    ProfileComponent
    // NotificationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LoginComponent,
    RegisterComponent,
    ChatRoomComponent,
    ChatListComponent,
    CreateChatModalComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    UserAvatarComponent

  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,CD
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

