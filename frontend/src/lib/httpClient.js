import axios from "axios"
import { clearToken, getToken } from "@/auth/AuthHelpers.jsx"

const httpClient = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
httpClient.interceptors.request.use(config => {
  // Retrieve the JWT login token from local storage
  const token = getToken();
  if (token) {
    // If a token exists, add it to the Authorization header
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, error => {
  return Promise.reject(error);
});

httpClient.interceptors.response.use(response => response, error => {
  if (error.response && [401, 403].includes(error.response.status)) {
    clearToken(true);
  }

  return Promise.reject(error);

});

export default httpClient;