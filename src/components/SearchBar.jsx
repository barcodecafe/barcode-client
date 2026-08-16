import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Store, Loader2 } from 'lucide-react';
import { globalSearch } from '../services/searchService';

export const SearchBar = ({ variant = 'desktop', onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ foods: [], branches: [], brands: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Safe Array check for rendering
  const foodsList = Array.isArray(results?.foods) ? results.foods : [];
  const branchesList = Array.isArray(results?.branches) ? results.branches : [];
  const brandsList = Array.isArray(results?.brands) ? results.brands : [];
  const hasResults = foodsList.length > 0 || branchesList.length > 0 || brandsList.length > 0;

  useEffect(() => {
    if (!query.trim()) {
      setResults({ foods: [], branches: [], brands: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setResults({
            foods: Array.isArray(data.foods) ? data.foods : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
            brands: Array.isArray(data.brands) ? data.brands : [],
          });
        } else if (Array.isArray(data)) {
          // If API returns a single combined array
          setResults({
            foods: data.filter((item) => item.type === 'food' || item.price !== undefined),
            branches: data.filter((item) => item.type === 'branch' || item.location !== undefined),
            brands: data.filter((item) => item.type === 'brand' || item.slug !== undefined),
          });
        } else {
          setResults({ foods: [], branches: [], brands: [] });
        }
      } catch (err) {
        console.error('Search failed:', err);
        setResults({ foods: [], branches: [], brands: [] });
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

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
      navigate(`/branches/${branch.id}`);
    },
    [navigate, onClose]
  );

  const handleSelectBrand = useCallback(
    (brand) => {
      setQuery('');
      setIsOpen(false);
      onClose?.();
      navigate(`/brands/${brand.slug || brand.id}`);
    },
    [navigate, onClose]
  );

  const dropdown = isOpen && query.trim() !== '' && (
    <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-2xl z-50">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-neutral-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          Searching...
        </div>
      ) : !hasResults ? (
        <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          No matches for "{query}"
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Foods Section */}
          {foodsList.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Dishes
              </p>
              {foodsList.map((food) => {
                const numPrice = Number(food.price) || 0;
                return (
                  <button
                    key={`food-${food.id}`}
                    onClick={() => handleSelectFood(food)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                  >
                    {food.image && (
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                        {food.name}
                      </p>
                      <p className="text-xs text-neutral-400">{food.category}</p>
                    </div>
                    <span className="text-xs font-bold text-primary-500 shrink-0">
                      ৳{numPrice.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Branches Section */}
          {branchesList.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Branches
              </p>
              {branchesList.map((branch) => (
                <button
                  key={`branch-${branch.id}`}
                  onClick={() => handleSelectBranch(branch)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                      {branch.name}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{branch.location}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Brands Section */}
          {brandsList.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Brands
              </p>
              {brandsList.map((brand) => (
                <button
                  key={`brand-${brand.id}`}
                  onClick={() => handleSelectBrand(brand)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  {brand.logo || brand.image ? (
                    <img
                      src={brand.logo || brand.image}
                      alt={brand.name}
                      className="w-9 h-9 rounded-lg object-contain bg-neutral-50 dark:bg-neutral-800 p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-primary-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                      {brand.name}
                    </p>
                    {brand.description && (
                      <p className="text-xs text-neutral-400 truncate">{brand.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div className="relative w-full">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Search dishes, branches, brands..."
            className="flex-grow bg-transparent outline-none text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden lg:block w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        placeholder="Search dishes, branches, brands..."
        className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setIsOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {dropdown}
    </div>
  );
};

export default SearchBar;