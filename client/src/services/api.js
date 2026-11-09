import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// attach the token to the request header
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// for handling unauthorized err
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authUser');
      
      // ✅ Check karo: Agar user pehle se login page par nahi hai, sirf tabhi redirect/refresh karo
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;