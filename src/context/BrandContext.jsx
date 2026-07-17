import { createContext, useContext } from "react";

// Provides the current brand to everything rendered inside a /brands/:slug
// microsite (BrandLayout, BrandHome, BrandMenu). null on the group-level site.
const BrandContext = createContext(null);

export const BrandProvider = ({ brand, children }) => (
  <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
);

export const useBrand = () => useContext(BrandContext);

export default BrandContext;
