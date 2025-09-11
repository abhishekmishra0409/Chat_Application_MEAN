// app.routes.ts  (rename file for clarity)
import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChatListComponent } from './components/chat/chat-list/chat-list.component';
import { ChatRoomComponent } from './components/chat/chat-room/chat-room.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { ProfileComponent } from './components/shared/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: '/', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'chat', component: ChatListComponent, canActivate: [AuthGuard] },
  { path: 'chat/:id', component: ChatRoomComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/chat' }
];
