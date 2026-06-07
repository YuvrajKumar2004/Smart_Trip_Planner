import axios from 'axios';
console.log("🔥 API FILE LOADED");
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');
//
//   if (token && token !== 'undefined' && token !== 'null') {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//
//   return config;
// });
api.interceptors.request.use((config) => {

    console.log("🚀 REQUEST:", config.url);

    const token = localStorage.getItem('accessToken');

    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// api.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error.response?.data || error),
// );
api.interceptors.response.use(
    (response) => {
        console.log("SUCCESS:", response.config.url);
        return response;
    },

    async (error) => {
        console.log("RESPONSE INTERCEPTOR HIT");
        console.log(error);

      const originalRequest = error.config || {};

      console.log("Status:", error.response?.status);

      if (
          (error.response?.status === 401 ||
          error.response?.status === 403) &&
          originalRequest &&
          !originalRequest._retry
      ){

        originalRequest._retry = true;

        try {
          console.log("Trying refresh...");
          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            throw new Error('No refresh token found');
          }

          const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
              { refreshToken }
          );
          
          console.log("Refresh response:", refreshResponse.data);
          const tokenData = refreshResponse.data?.data;
          const newAccessToken = tokenData?.accessToken;
          const newRefreshToken = tokenData?.refreshToken;

          if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Update Zustand store in localStorage directly to avoid circular dependency issues at runtime
          try {
              const authStorageStr = localStorage.getItem('auth-storage');
              if (authStorageStr) {
                  const authStorage = JSON.parse(authStorageStr);
                  if (newAccessToken) authStorage.state.accessToken = newAccessToken;
                  if (newRefreshToken) authStorage.state.refreshToken = newRefreshToken;
                  localStorage.setItem('auth-storage', JSON.stringify(authStorage));
              }
          } catch(e) {
              console.error("Error updating auth-storage:", e);
          }

          return api(originalRequest);

        } catch (refreshError) {
          console.log("Refresh failed", refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-storage'); // This ensures Zustand state clears on reload

          window.location.href = '/login';

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
);

export default api;
