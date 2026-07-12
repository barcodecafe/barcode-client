// ---------------------------------------------------------------------------
// foodsData.js
//
// Mirrors a `foods` table shape an admin panel / backend would manage.
//
// Fields added for upcoming backend integration:
//   - isAdminFeatured : boolean   → admin manually pins this dish into the
//                                   Home page "Popular Dishes" section,
//                                   overriding the default rating-based sort.
//   - featuredOrder   : number    → only matters when isAdminFeatured is
//                                   true; controls left-to-right order among
//                                   admin-picked dishes (lower = earlier).
//   - branchIds       : number[]  → which branches carry this dish. Left
//                                   empty/undefined for now since there's no
//                                   admin UI to set it yet — see the note in
//                                   foodsService.getFoodsByBranch(), which
//                                   already checks for this field and will
//                                   switch to real per-branch filtering the
//                                   moment any item has it populated.
//
// See services/foodsService.js for all read access — pages should import
// from there, not from this file directly.
// ---------------------------------------------------------------------------

export const foodsData = [
  {
    id: 1,
    name: "Barcode Signature Burger",
    category: "Mains",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    description: "Premium Angus beef patty, cheddar, truffle mayo, caramelized onions, brioche bun, and hand-cut fries.",
    popular: true,
    isAdminFeatured: true,
    featuredOrder: 1,
    branchIds: []
  },
  {
    id: 2,
    name: "Truffle Mushroom Pasta",
    category: "Mains",
    price: 22.50,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    description: "Fresh fettuccine tossed in a rich, creamy wild mushroom and black truffle paste sauce.",
    popular: true,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 3,
    name: "Dry-Aged Ribeye Steak",
    category: "Mains",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    description: "14-day dry-aged USDA Prime ribeye, grilled to perfection, served with garlic herb butter and roasted asparagus.",
    popular: true,
    isAdminFeatured: true,
    featuredOrder: 2,
    branchIds: []
  },
  {
    id: 4,
    name: "Supreme Sushi Platter",
    category: "Mains",
    price: 32.00,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    description: "Assorted premium sashimi, nigiri, and chef's special rolls served with pickled ginger and wasabi.",
    popular: true,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 5,
    name: "Wood-Fired Margherita Pizza",
    category: "Mains",
    price: 16.50,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    description: "San Marzano tomatoes, fresh buffalo mozzarella, organic basil, and extra virgin olive oil.",
    popular: true,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 6,
    name: "Pan-Seared Crispy Salmon",
    category: "Mains",
    price: 28.00,
    image: "https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    description: "Crispy skin-on salmon fillet, creamy lemon dill sauce, wild rice, and seasonal greens.",
    popular: true,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 7,
    name: "Burrata Salad",
    category: "Appetizers",
    price: 14.00,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    description: "Creamy burrata cheese, heirloom cherry tomatoes, basil pesto, balsamic reduction, toasted focaccia.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 8,
    name: "Spiced Garlic Prawns",
    category: "Appetizers",
    price: 15.50,
    image: "https://images.unsplash.com/photo-1559737607-3578911a4fae?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    description: "King prawns sautéed in sizzling olive oil, garlic, chili flakes, served with sourdough.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 9,
    name: "Warm Chocolate Lava Cake",
    category: "Desserts",
    price: 9.50,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    description: "Decadent dark chocolate cake with a molten liquid center, served with vanilla bean gelato.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 10,
    name: "Classic Italian Tiramisu",
    category: "Desserts",
    price: 9.00,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    description: "Layers of espresso-soaked ladyfingers, velvety mascarpone cream, and premium cocoa powder.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 11,
    name: "Signature Rose Berry Mocktail",
    category: "Drinks",
    price: 7.50,
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    description: "Fresh muddled berries, organic rose water syrup, sparkling water, mint, and fresh lime juice.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 12,
    name: "Classic Mint Mojito",
    category: "Drinks",
    price: 8.50,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    description: "White rum (optional/mocktail version available), fresh lime juice, sugar cane syrup, muddled mint.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 13,
    name: "Classic Mint Mojito",
    category: "Vegan",
    price: 8.50,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    description: "White rum (optional/mocktail version available), fresh lime juice, sugar cane syrup, muddled mint.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  },
  {
    id: 14,
    name: "Classic Mint Mojito",
    category: "Side Dishes",
    price: 8.50,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    description: "White rum (optional/mocktail version available), fresh lime juice, sugar cane syrup, muddled mint.",
    popular: false,
    isAdminFeatured: false,
    featuredOrder: null,
    branchIds: []
  }
];
