import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Search } from 'lucide-react';
import { getAllBranches } from '../services/branchesService';

// ---------------------------------------------------------------------------
// Branches.jsx
//
// Converted to read through services/branchesService.js instead of
// importing branchesData.js directly, matching the pattern used by
// Home.jsx, Menu.jsx, and BranchDetail.jsx. Filtering/search/region logic
// is unchanged — it now just runs against the service-loaded `branches`
// state instead of the static import.
// ---------------------------------------------------------------------------
export const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    getAllBranches().then((data) => {
      setBranches(data);
      setIsLoading(false);
    });
  }, []);

  // Group mappings to categorize regions based on branch location strings
  const getRegion = (branch) => {
    if (branch && branch.region) return branch.region;
    if (!branch || !branch.location) return "Chattogram";
    const loc = branch.location.toLowerCase();
    if (loc.includes("cox's bazar")) return "Cox's Bazar";
    if (loc.includes("dhaka") || loc.includes("banani")) return "Dhaka";
    return "Chattogram";
  };

  // Filters branches based on search queries and selected region toggles
  const filteredBranches = useMemo(
    () =>
      branches.filter((branch) => {
        const matchesSearch =
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRegion =
          activeRegion === 'All' || getRegion(branch) === activeRegion;

        return matchesSearch && matchesRegion;
      }),
    [branches, searchQuery, activeRegion]
  );

  const regions = ['All', 'Chattogram', "Cox's Bazar", 'Dhaka'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Filters and Search Bar Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Regions Horizontal Navigation Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                activeRegion === region
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-primary-500'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Input Search Field */}
        {/* <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
          />
        </div> */}
      </div>

      {/* Main Content Showcase Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          Available Venues ({filteredBranches.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 overflow-hidden animate-pulse"
              >
                <div className="h-48 w-full bg-neutral-100 dark:bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No branches match your search or filter.</p>
          </div>
        ) : (
          /* Grid scaled layout up to 6 columns on desktop viewports */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredBranches.map((branch) => (
              <motion.div
                key={branch.id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/branches/${branch.id}`)}
                className="cursor-pointer group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 hover:shadow-xl"
              >
                {/* Branch Thumbnail Graphic Image */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary-500 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                    ★ {branch.rating}
                  </div>
                </div>

                {/* Text Details Breakdown Layout */}
                <div className="p-5 flex flex-col justify-between flex-grow gap-4">
                  <div>
                    <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-100 group-hover:text-primary-500 transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-1">
                      {branch.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                    <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Branches;
