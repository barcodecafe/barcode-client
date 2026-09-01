import apiClient from './apiClient';

/** POST /api/feedbacks — Submit customer experience feedback */
export async function submitFeedback(feedbackData) {
  const res = await apiClient.post('/feedbacks', feedbackData);
  return res?.data || res;
}

/** GET /api/feedbacks/my — Get logged-in user's feedback history */
export async function getMyFeedbacks(phone = '') {
  const params = phone ? { phone } : {};
  const res = await apiClient.get('/feedbacks/my', { params });
  return res?.data || res;
}

/** GET /api/feedbacks — Admin: Get all customer feedback with filters */
export async function getAllFeedbacks(filters = {}) {
  const res = await apiClient.get('/feedbacks', { params: filters });
  return res?.data || res;
}

/** GET /api/feedbacks/rider/:riderId — Get rider performance reviews & notes */
export async function getRiderFeedbacks(riderId) {
  const res = await apiClient.get(`/feedbacks/rider/${riderId}`);
  return res?.data || res;
}

/** DELETE /api/feedbacks/:id — Admin: Delete feedback */
export async function deleteFeedback(id) {
  const res = await apiClient.delete(`/feedbacks/${id}`);
  return res?.data || res;
}
