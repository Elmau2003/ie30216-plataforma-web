// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
  };

  // Solo agregamos 'Content-Type': 'application/json' si el body NO es FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parseo seguro para evitar "Unexpected end of JSON input" si el servidor responde sin body
  const textData = await response.text();
  const data = textData ? JSON.parse(textData) : {};

  if (!response.ok) {
    throw new Error(data.mensaje || `Error en la petición (${response.status})`);
  }

  return data;
};