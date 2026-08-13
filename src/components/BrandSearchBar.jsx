import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, UtensilsCrossed, Loader2 } from 'lucide-react';
import { getBrandMenu, getBrandBranches } from '../services/brandsService';

export const BrandSearchBar = ({ brand, variant = 'desktop', onClose }) => {
  const [query, setQuery] = useState('');
  const [menuFoods, setMenuFoods] = useState([]);
  const [brandBranches, setBrandBranches] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // 🚀 ১. ব্রান্ডের নিজস্ব ফুড ও ব্রাঞ্চ ডাটা লোড করা (শুধুমাত্র ওই ব্রান্ডের ডাটা)
  useEffect(() => {
    if (!brand?.slug) return;
    let isMounted = true;

    Promise.all([
      getBrandMenu(brand.slug).catch(() => ({ foods: [] })),
      getBrandBranches(brand.slug).catch(() => ({ branches: [] })),
    ]).then(([menuRes, branchRes]) => {
      if (isMounted) {
        setMenuFoods(Array.isArray(menuRes?.foods) ? menuRes.foods : []);
        setBrandBranches(Array.isArray(branchRes?.branches) ? branchRes.branches : []);
        setDataLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [brand?.slug]);

  // 🚀 ২. ফিল্টারিং লজিক: শুধুমাত্র এই ব্রান্ডের ডিশ ও ব্রাঞ্চ থেকে ফিল্টার হবে
  const filteredFoods = query.trim()
    ? menuFoods.filter((food) => {
        const q = query.toLowerCase();
        return (
          food.name?.toLowerCase().includes(q) ||
          food.description?.toLowerCase().includes(q) ||
          food.category?.toLowerCase().includes(q)
        );
      })
    : [];

  const filteredBranches = query.trim()
    ? brandBranches.filter((branch) => {
        const q = query.toLowerCase();
        return (
          branch.name?.toLowerCase().includes(q) ||
          branch.location?.toLowerCase().includes(q) ||
          branch.address?.toLowerCase().includes(q)
        );
      })
    : [];

  const hasResults = filteredFoods.length > 0 || filteredBranches.length > 0;

  useEffect(() => {
    if (!query.trim()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Handle outside click for desktop
  useEffect(() => {
    if (variant !== 'desktop') return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  const handleSelectFood = useCallback(
    (food) => {
      setQuery('');
      setIsOpen(false);
      onClose?.();
      navigate(`/menu/${food.id || food._id}`);
    },
    [navigate, onClose]
  );

  const handleSelectBranch = useCallback(
    (branch) => {
      setQuery('');
      setIsOpen(false);
      onClose?.();
      if (brand?.slug) {
        navigate(`/brands/${brand.slug}/branches/${branch.id || branch._id}`);
      } else {
        navigate(`/branches/${branch.id || branch._id}`);
      }
    },
    [navigate, onClose, brand?.slug]
  );

  const dropdown = isOpen && query.trim() !== '' && (
    <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl z-50 divide-y divide-neutral-100 dark:divide-neutral-800">
      {isLoading || !dataLoaded ? (
        <div className="flex items-center justify-center gap-2 py-6 text-neutral-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          Searching {brand?.name || 'brand'} items...
        </div>
      ) : !hasResults ? (
        <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          No matches found for "{query}" in {brand?.name}
        </div>
      ) : (
        <>
          {/* Foods Section */}
          {filteredFoods.length > 0 && (
            <div className="p-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-500">
                {brand?.name} Dishes ({filteredFoods.length})
              </p>
              {filteredFoods.map((food) => (
                <button
                  key={`brand-food-${food.id || food._id}`}
                  onClick={() => handleSelectFood(food)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group"
                >
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-primary-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 truncate transition-colors">
                      {food.name}
                    </p>
                    {food.category && (
                      <p className="text-[10px] text-neutral-400 truncate">{food.category}</p>
                    )}
                  </div>
                  {food.price !== undefined && (
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0">
                      ৳{food.price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Branches Section */}
          {filteredBranches.length > 0 && (
            <div className="p-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-500">
                {brand?.name} Branches ({filteredBranches.length})
              </p>
              {filteredBranches.map((branch) => (
                <button
                  key={`brand-branch-${branch.id || branch._id}`}
                  onClick={() => handleSelectBranch(branch)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group"
                >
                  {branch.image ? (
                    <img
                      src={branch.image}
                      alt={branch.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 truncate transition-colors">
                      {branch.name}
                    </p>
                    {branch.location && (
                      <p className="text-[10px] text-neutral-400 truncate">{branch.location}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${brand?.name || 'brand'} dishes, branches...`}
            autoFocus
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 border border-transparent focus:border-primary-500/40 focus:outline-none transition-all"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        {query.trim() !== '' && (
          <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-xl divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading || !dataLoaded ? (
              <div className="flex items-center justify-center gap-2 py-6 text-neutral-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                Searching...
              </div>
            ) : !hasResults ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No matches found in {brand?.name}
              </div>
            ) : (
              <>
                {filteredFoods.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-500">
                      Dishes ({filteredFoods.length})
                    </p>
                    {filteredFoods.map((food) => (
                      <button
                        key={`m-food-${food.id || food._id}`}
                        onClick={() => handleSelectFood(food)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate flex-1">
                          {food.name}
                        </span>
                        {food.price !== undefined && (
                          <span className="text-xs font-bold text-primary-500">৳{food.price}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {filteredBranches.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-500">
                      Branches ({filteredBranches.length})
                    </p>
                    {filteredBranches.map((branch) => (
                      <button
                        key={`m-branch-${branch.id || branch._id}`}
                        onClick={() => handleSelectBranch(branch)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate flex-1">
                          {branch.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={`Search ${brand?.name || 'brand'}...`}
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400/90 border border-neutral-200/50 dark:border-neutral-800/50 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all"
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </div>
      {dropdown}
    </div>
  );
};

export default BrandSearchBar;
