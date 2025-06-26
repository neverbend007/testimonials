// Authentication utility functions

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('csrfToken');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getCSRFToken = () => {
  return localStorage.getItem('csrfToken');
};

export const setCSRFToken = (token) => {
  localStorage.setItem('csrfToken', token);
};

export const logout = () => {
  removeToken();
  window.location.href = '/login';
};