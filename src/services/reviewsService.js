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
    const idParam = Number.isFinite(Number(foodId)) ? Number(foodId) : foodId;
    const res = await apiClient.get(`/reviews/food/${idParam}`);
    const data = res?.data || res;
    if (data && typeof data === 'object') {
      const revs = Array.isArray(data.reviews) ? data.reviews : [];
      const computedAvg =
        revs.length > 0
          ? Number((revs.reduce((acc, r) => acc + Number(r.rating || 0), 0) / revs.length).toFixed(1))
          : 4.5;

      return {
        foodId: data.foodId || idParam,
        reviews: revs,
        totalReviews: Number(data.totalReviews ?? revs.length),
        averageRating: Number(data.averageRating ?? computedAvg),
        ratingCounts: data.ratingCounts || fallback.ratingCounts,
      };
    }
    return fallback;
  } catch (err) {
    console.warn(`Could not load reviews for food ${foodId}:`, err?.message || err);
    return fallback;
  }
}

/** POST /api/reviews — Submit or update a review for a food item (Protected) */
export async function submitReview({ foodId, rating, comment }) {
  const idParam = Number.isFinite(Number(foodId)) ? Number(foodId) : foodId;
  return apiClient.post('/reviews', {
    foodId: idParam,
    rating: Number(rating),
    comment: comment || '',
  });
}

/** DELETE /api/reviews/:id — Delete a review (Protected) */
export async function deleteReview(reviewId) {
  return apiClient.delete(`/reviews/${Number(reviewId)}`);
}
