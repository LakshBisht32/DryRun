const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  studentDashboard: (token) => request('/dashboard/student', { token }),
  interviewerDashboard: (token) => request('/dashboard/interviewer', { token }),

  // interviewer directory / profile
  listInterviewers: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/interviewers${suffix}`);
  },
  getInterviewer: (id) => request(`/interviewers/${id}`),
  getInterviewerSlots: (id, status) =>
    request(`/interviewers/${id}/slots${status ? `?status=${status}` : ''}`),
  saveInterviewerProfile: (payload, token) =>
    request('/interviewer-profile', { method: 'POST', body: payload, token }),
  getMyInterviewerProfile: (token) => request('/interviewer-profile/me', { token }),

  // slots
  createSlot: (payload, token) => request('/slots', { method: 'POST', body: payload, token }),
  listMySlots: (token) => request('/slots/mine', { token }),
  requestSlot: (slotId, token) => request(`/slots/${slotId}/request`, { method: 'POST', token }),

  // bookings
  listMyBookingsAsStudent: (token) => request('/bookings/mine/student', { token }),
  listMyBookingsAsInterviewer: (token) => request('/bookings/mine/interviewer', { token }),
  acceptBooking: (id, payload, token) =>
    request(`/bookings/${id}/accept`, { method: 'POST', body: payload, token }),
  rejectBooking: (id, token) => request(`/bookings/${id}/reject`, { method: 'POST', token }),
  setMeetingLink: (id, meeting_link, token) =>
    request(`/bookings/${id}/meeting-link`, { method: 'POST', body: { meeting_link }, token }),
  cancelBooking: (id, token) => request(`/bookings/${id}/cancel`, { method: 'POST', token }),
  submitScorecard: (id, payload, token) =>
    request(`/bookings/${id}/scorecard`, { method: 'POST', body: payload, token }),

  // student
  getMyScorecards: (token) => request('/students/me/scorecards', { token }),
};
