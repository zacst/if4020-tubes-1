import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sessionToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (username: string, publicKey: string) => {
  return api.post('/auth/register', { username, publicKey });
};

export const loginChallenge = async (username: string) => {
  return api.post('/auth/login/challenge', { username });
};

export const loginVerify = async (username: string, signature: { r: string; s: string }) => {
  return api.post('/auth/login/verify', { username, signature });
};

export const getContacts = async () => {
  return api.get('/api/contacts');
};

export const addContact = async (contactUsername: string) => {
  return api.post('/api/contacts/add', { contactUsername });
};

export const searchUsers = async (query: string) => {
  return api.get(`/api/users/search?q=${query}`);
};

export const sendMessage = async (message: any) => {
  return api.post('/api/chat/send', message);
};

export const getMessages = async (contactUsername: string) => {
  return api.get(`/api/chat/history?contact=${contactUsername}`);
};
