import type { Contact, Message } from '../types';

export const contacts: Contact[] = [
  { id: 1, name: 'Alice Johnson', lastMessage: 'Hey! How are you doing?', time: '10:30 AM', unread: 3, avatar: '👩' },
  { id: 2, name: 'Bob Smith', lastMessage: 'That sounds great!', time: 'Yesterday', avatar: '👨' },
  { id: 3, name: 'Carol White', lastMessage: 'See you tomorrow 👋', time: 'Tuesday', avatar: '👩‍🦰' },
  { id: 4, name: 'David Brown', lastMessage: 'Thanks for the help!', time: 'Monday', avatar: '👨‍🦱' },
  { id: 5, name: 'Eva Green', lastMessage: 'Perfect timing!', time: 'Sunday', avatar: '👩‍🦳' },
];

export const chatMessages: Message[] = [
  { id: 1, text: 'Hey! How are you doing?', time: '10:25 AM', sent: false },
  { id: 2, text: 'I\'m doing great! Thanks for asking 😊', time: '10:26 AM', sent: true },
  { id: 3, text: 'Want to grab coffee this weekend?', time: '10:27 AM', sent: false },
  { id: 4, text: 'That sounds perfect! Saturday afternoon?', time: '10:30 AM', sent: true },
];