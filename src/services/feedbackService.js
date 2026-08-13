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

/** GET /api/feedbacks — Admin: Get all customer feedback */
export async function getAllFeedbacks(filters = {}) {
  const res = await apiClient.get('/feedbacks', { params: filters });
  return res?.data || res;
}
