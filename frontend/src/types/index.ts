export interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatar: string;
}

export interface Message {
  id: number;
  text: string;
  time: string;
  sent: boolean;
}

export interface User {
  username: string;
  password: string;
}