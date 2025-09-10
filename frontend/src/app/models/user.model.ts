export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  socketId?: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}
