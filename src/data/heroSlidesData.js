// ---------------------------------------------------------------------------
// heroSlidesData.js
//
// Mirrors a `hero_slides` table an admin panel would manage.
//
// `type` is the field the admin explicitly sets per slide and is what
// drives whether the "Order Now" button appears on Home.jsx:
//
//   - 'promo'   : an advertisement / food-offer image. The "Order Now"
//                 button is shown, and clicking it adds `featuredFoodId`
//                 straight to the cart. `featuredFoodId` is REQUIRED for
//                 promo slides.
//
//   - 'ambient' : a general restaurant/atmosphere photo (interior shots,
//                 lifestyle imagery, branding). No "Order Now" button —
//                 there's no specific product being advertised.
//                 `featuredFoodId` is ignored even if present.
//
// BACKEND: GET /api/hero-slides  (ordered by an admin-set `sortOrder`,
// omitted here since this mock array's order IS the display order)
// ---------------------------------------------------------------------------

export const heroSlidesData = [
  {
    id: 1,
    type: 'promo',
    title: 'Savor the Art of Modern Dining',
    subtitle: 'Where culinary creativity meets sophisticated atmosphere.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
    cta: 'Order Now',
    featuredFoodId: 3 // Dry-Aged Ribeye Steak — premium signature dish
  },
  {
    id: 2,
    type: 'promo',
    title: 'Exquisite Flavors, Crafted with Passion',
    subtitle: "Indulge in our chef's signature prime-cut selections and fresh pasta.",
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80',
    cta: 'Order Now',
    featuredFoodId: 2 // Truffle Mushroom Pasta
  },
  {
    id: 3,
    type: 'ambient',
    title: 'An Atmosphere as Memorable as the Food',
    subtitle: 'Stunning designs and premium dining experiences in every branch.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80',
    cta: null,
    featuredFoodId: null
  }
];
