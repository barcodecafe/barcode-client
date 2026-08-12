import apiClient from './apiClient';

/** GET /api/reviews/food/:foodId — Get reviews & rating summary for a food */
export async function getFoodReviews(foodId) {
  const fallback = {
    reviews: [],
    totalReviews: 0,
    averageRating: 4.5,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
  if (!foodId) return fallback;
  try {
    const res = await apiClient.get(`/reviews/food/${Number(foodId)}`);
    return res || fallback;
  } catch (err) {
    console.warn(`Could not load reviews for food ${foodId}:`, err?.message || err);
    return fallback;
  }
}

/** POST /api/reviews — Submit or update a review for a food item (Protected) */
export async function submitReview({ foodId, rating, comment }) {
  return apiClient.post('/reviews', {
    foodId: Number(foodId),
    rating: Number(rating),
    comment: comment || '',
  });
}

/** DELETE /api/reviews/:id — Delete a review (Protected) */
export async function deleteReview(reviewId) {
  return apiClient.delete(`/reviews/${Number(reviewId)}`);
}
