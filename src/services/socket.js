// src/services/socket.js
import { io } from "socket.io-client";

// ১. apiClient.js এর মতোই Base URL নেওয়া
let SOCKET_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// ২. HTTPS Guard: apiClient.js এর মতো Mixed Content Error ঠেকানোর জন্য
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  SOCKET_URL.startsWith('http://')
) {
  SOCKET_URL = SOCKET_URL.replace(/^http:\/\//i, 'https://');
}

// ৩. যদি VITE_API_BASE_URL এর শেষে '/api' থাকে (যেমন: http://localhost:5000/api),
// তবে মূল সকেটের জন্য পিছনের '/api' অংশটুকু মুছে নেওয়া
SOCKET_URL = SOCKET_URL.replace(/\/api\/?$/, '');

// ৪. Socket Client তৈরি
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: (cb) => {
    // apiClient.js এর মতো অটোমেটিক authToken পাঠানো
    const token = localStorage.getItem('authToken');
    cb({ token: token ? `Bearer ${token}` : '' });
  },
});