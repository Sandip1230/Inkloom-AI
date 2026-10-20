import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  // Must stay comfortably ABOVE the server's own AI-call timeout (55s in
  // client.js) - otherwise the browser gives up and closes the connection
  // before the server has a chance to respond at all, and the server's
  // eventual reply (success or error) goes nowhere. 60s gives the server's
  // 55s ceiling a bit of headroom for network/proxy latency.
  timeout: 60000,
});

function toFriendlyError(error) {
  if (error.code === 'ECONNABORTED') {
    return new Error(
      "The AI is taking longer than usual to respond (this can happen with the free model under load). Please try again - if it keeps happening, try again in a minute."
    );
  }
  if (error.response?.data?.error) {
    return new Error(error.response.data.error);
  }
  if (error.request) {
    return new Error('Could not reach the Brandloom server. Check that the backend is running and reachable.');
  }
  return error;
}

export async function runStage(stageName, payload) {
  try {
    const { data } = await api.post(`/api/stages/${stageName}`, payload);
    return data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function getBrand(id) {
  try {
    const { data } = await api.get(`/api/brand/${id}`);
    return data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function saveBrand(id, payload) {
  try {
    const { data } = await api.put(`/api/brand/${id}`, payload);
    return data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}