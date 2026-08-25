// src/services/socket.js
import { io } from "socket.io-client";

const getSocketUrl = () => {
  let url = import.meta.env?.VITE_API_BASE_URL;

  // If VITE_API_BASE_URL is explicitly set (e.g. https://api.barcoderestaurantgroup.com/api or http://151.158.101.246:5000/api)
  if (url && typeof url === 'string') {
    url = url.replace(/\/api\/?$/, '');
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      url = url.replace(/^http:\/\//i, 'https://');
    }
    return url;
  }

  // Fallback when VITE_API_BASE_URL is not set or is relative (/api)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: (cb) => {
    const token = localStorage.getItem('authToken');
    cb({ token: token ? `Bearer ${token}` : '' });
  },
});

export const refreshSocketAuth = () => {
  if (socket && typeof socket.disconnect === 'function') {
    socket.disconnect();
    socket.connect();
  }
};