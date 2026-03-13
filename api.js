import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ===================================================================
//  (!)  IMPORTANT -- SET YOUR PC's IP ADDRESS HERE
//
//  1. On your PC, open Command Prompt and run:   ipconfig
//  2. Look for "IPv4 Address" under your WiFi adapter
//     It will look like: 192.168.1.XXX  or  10.0.0.XXX
//  3. Replace the IP below with that value
//  4. Make sure your phone and PC are on the SAME WiFi network
//  5. Make sure your backend is running: node server.js
// ===================================================================
export const API_BASE = 'http://192.168.1.100:5000/api'; // <-- CHANGE THIS IP

const API = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 seconds -- prevents indefinite hangs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
API.interceptors.request.use(async (config) => {
  try {
    const staffToken   = await SecureStore.getItemAsync('staffToken');
    const citizenToken = await SecureStore.getItemAsync('citizenToken');
    const token = staffToken || citizenToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

// Friendly error messages instead of raw AxiosError
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.friendlyMessage =
        'Connection timed out. Make sure:\n' +
        '* Your backend is running (node server.js)\n' +
        `* The IP in api.js is correct (currently: ${API_BASE})\n` +
        '* Your phone and PC are on the same WiFi';
    } else if (!error.response) {
      error.friendlyMessage =
        'Cannot reach server. Check that:\n' +
        '* Backend is running on port 5000\n' +
        `* IP address is correct: ${API_BASE}`;
    }
    return Promise.reject(error);
  }
);

export default API;
