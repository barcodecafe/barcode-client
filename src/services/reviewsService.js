import apiClient from './apiClient';

/** GET /api/reviews/food/:foodId — Get reviews & rating summary for a food */
export async function getFoodReviews(foodId) {
  if (!foodId) return { reviews: [], totalReviews: 0, averageRating: 4.5, ratingCounts: {} };
  return apiClient.get(`/reviews/food/${Number(foodId)}`);
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
