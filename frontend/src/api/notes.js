const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('notes-auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('notes-auth-token');
    localStorage.removeItem('notes-user');
    window.location.reload(); // Quick way to redirect to login
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'API Request failed');
  }
  return res.json();
};

export async function fetchNotes(search = '', archived = false) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('archived', archived.toString());

  const res = await fetch(`${API_URL}/notes?${params}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function fetchNote(id) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function createNote(data = {}) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateNote(id, data) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteNote(id) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
}
