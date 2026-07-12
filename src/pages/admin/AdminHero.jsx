// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Plus, Edit2, Trash2, X, Image as ImageIcon, Link2 } from 'lucide-react';
// import { getAllSlides, createSlide, updateSlide, deleteSlide } from '../../services/heroSlidesService';
// import { getAllFoods } from '../../services/foodsService';

// export const AdminHero = () => {
//   const [slides, setSlides] = useState([]);
//   const [foods, setFoods] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingSlide, setEditingSlide] = useState(null);

//   // Form State
//   const [formData, setFormData] = useState({
//     type: 'promo',
//     title: '',
//     subtitle: '',
//     image: '',
//     cta: 'Order Now',
//     featuredFoodId: '',
//     offerText: ''
//   });
//   const [formError, setFormError] = useState('');

//   const fetchSlides = () => {
//     setLoading(true);
//     Promise.all([getAllSlides(), getAllFoods()]).then(([slidesData, foodsData]) => {
//       setSlides(slidesData);
//       setFoods(foodsData);
//       setLoading(false);
//     });
//   };

//   useEffect(() => {
//     fetchSlides();
//   }, []);

//   const openAddModal = () => {
//     setEditingSlide(null);
//     setFormData({
//       type: 'promo',
//       title: '',
//       subtitle: '',
//       image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
//       cta: 'Order Now',
//       featuredFoodId: '',
//       offerText: ''
//     });
//     setFormError('');
//     setIsModalOpen(true);
//   };

//   const openEditModal = (slide) => {
//     setEditingSlide(slide);
//     setFormData({
//       type: slide.type,
//       title: slide.title,
//       subtitle: slide.subtitle,
//       image: slide.image,
//       cta: slide.cta || '',
//       featuredFoodId: slide.featuredFoodId || '',
//       offerText: slide.offerText || ''
//     });
//     setFormError('');
//     setIsModalOpen(true);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       //  Max 2MB
//       if (file.size > 2 * 1024 * 1024) {
//         setFormError("File size should be less than 2MB");
//         return;
//       }

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData((prev) => ({
//           ...prev,
//           image: reader.result, 
//         }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };


//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     setFormError('');

//     if (!formData.title.trim() || !formData.image.trim()) {
//       setFormError('Please fill in Slide Title and background Image URL.');
//       return;
//     }

//     try {
//       const payload = {
//         ...formData,
//         featuredFoodId: formData.type === 'promo' && formData.featuredFoodId ? parseInt(formData.featuredFoodId, 10) : null,
//         cta: formData.type === 'promo' ? formData.cta || 'Order Now' : null,
//         offerText: formData.type === 'promo' ? formData.offerText || '' : null
//       };

//       if (editingSlide) {
//         await updateSlide(editingSlide.id, payload);
//       } else {
//         await createSlide(payload);
//       }
//       setIsModalOpen(false);
//       fetchSlides();
//     } catch (err) {
//       setFormError(err.message || 'Something went wrong.');
//     }
//   };

//   const handleDeleteClick = async (id) => {
//     if (window.confirm('Are you sure you want to delete this hero slide?')) {
//       await deleteSlide(id);
//       fetchSlides();
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
//             Hero Carousel Management
//           </h1>
//           <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
//             Manage the homepage carousel slides. Toggle between food advertisements and general restaurant photos.
//           </p>
//         </div>

//         <button
//           onClick={openAddModal}
//           className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all shrink-0"
//         >
//           <Plus className="w-4 h-4" />
//           Add Slide
//         </button>
//       </div>

//       {/* Grid of slides */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {slides.map((slide) => {
//           const linkedDish = foods.find((f) => f.id === slide.featuredFoodId);
//           return (
//             <div
//               key={slide.id}
//               className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
//             >
//               <div>
//                 {/* Image container */}
//                 <div className="relative aspect-[16/9] overflow-hidden bg-neutral-950">
//                   <img
//                     src={slide.image}
//                     alt={slide.title}
//                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                  
//                   {/* Slide Type Badge */}
//                   <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${
//                     slide.type === 'promo' 
//                       ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' 
//                       : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
//                   }`}>
//                     {slide.type === 'promo' ? 'Food Ad Slide' : 'Atmosphere Photo'}
//                   </span>

//                   <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
//                     <h4 className="font-semibold text-sm truncate">{slide.title}</h4>
//                     <p className="text-[10px] text-neutral-300 truncate font-light mt-0.5">{slide.subtitle}</p>
//                   </div>
//                 </div>

//                 {/* Info block */}
//                 <div className="p-4 space-y-3.5">
//                   {slide.type === 'promo' && (
//                     <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-2.5 rounded-xl w-full">
//                       <Link2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
//                       <div className="min-w-0 flex-1">
//                         <span className="block font-bold">Featured Dish Link:</span>
//                         <span className="block font-medium truncate text-neutral-700 dark:text-neutral-300 mt-0.5">
//                           {linkedDish ? `${linkedDish.name} (৳${linkedDish.price})` : 'No dish linked'}
//                         </span>
//                         {slide.offerText && (
//                           <span className="block text-[10px] font-bold text-red-500 mt-1">
//                             Offer: {slide.offerText}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                   {slide.type === 'ambient' && (
//                     <p className="text-[10px] text-neutral-450 dark:text-neutral-500 italic p-1">
//                       * Ambient atmosphere slide. Will not display an Order button on home page.
//                     </p>
//                   )}
//                 </div>
//               </div>

//               {/* Actions row */}
//               <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20">
//                 <button
//                   onClick={() => openEditModal(slide)}
//                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all"
//                 >
//                   <Edit2 className="w-3.5 h-3.5" />
//                   Edit Slide
//                 </button>

//                 <button
//                   onClick={() => handleDeleteClick(slide.id)}
//                   className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
//                 >
//                   <Trash2 className="w-3.5 h-3.5" />
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={() => setIsModalOpen(false)}
//               className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs"
//             />

//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 8 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 8 }}
//               className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-10 p-6 max-h-[90vh] flex flex-col"
//             >
//               <div className="flex items-center justify-between pb-3 border-b border-neutral-150 dark:border-neutral-800 shrink-0">
//                 <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
//                   {editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
//                 </h3>
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               {formError && (
//                 <div className="mb-4 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 text-xs shrink-0">
//                   {formError}
//                 </div>
//               )}

//               <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto py-4 flex-1 pr-1">
//                 <div>
//                   <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
//                     Slide Type
//                   </label>
//                   <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl">
//                     <button
//                       type="button"
//                       onClick={() => setFormData((prev) => ({ ...prev, type: 'promo' }))}
//                       className={`py-2 text-xs font-bold rounded-lg transition-all ${
//                         formData.type === 'promo'
//                           ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
//                           : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
//                       }`}
//                     >
//                       Food Advertisement (Promo)
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setFormData((prev) => ({ ...prev, type: 'ambient' }))}
//                       className={`py-2 text-xs font-bold rounded-lg transition-all ${
//                         formData.type === 'ambient'
//                           ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
//                           : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
//                       }`}
//                     >
//                       Interior/Atmosphere (Ambient)
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
//                     Slide Title
//                   </label>
//                   <input
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleInputChange}
//                     placeholder="e.g. Savor the Art of Modern Dining"
//                     className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
//                     Slide Subtitle
//                   </label>
//                   <input
//                     type="text"
//                     name="subtitle"
//                     value={formData.subtitle}
//                     onChange={handleInputChange}
//                     placeholder="e.g. Where culinary creativity meets sophisticated atmosphere."
//                     className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
//                     Background Image URL
//                   </label>
//                   <div className="relative">
//                     <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
//                     <input
//                       type="text"
//                       name="image"
//                       value={formData.image}
//                       onChange={handleInputChange}
//                       placeholder="https://images.unsplash.com/..."
//                       className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {formData.type === 'promo' && (
//                   <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-850 rounded-2xl space-y-4">
//                     <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
//                       Promo Configuration
//                     </span>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       <div>
//                         <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
//                           Button CTA Text
//                         </label>
//                         <input
//                           type="text"
//                           name="cta"
//                           value={formData.cta}
//                           onChange={handleInputChange}
//                           className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
//                           Link to Food Dish
//                         </label>
//                         <select
//                           name="featuredFoodId"
//                           value={formData.featuredFoodId}
//                           onChange={handleInputChange}
//                           className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
//                         >
//                           <option value="">-- Select Dish --</option>
//                           {foods.map((food) => (
//                             <option key={food.id} value={food.id}>
//                               {food.name} (৳{food.price})
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div className="sm:col-span-2">
//                         <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
//                           Offer / Discount Text
//                         </label>
//                         <input
//                           type="text"
//                           name="offerText"
//                           value={formData.offerText}
//                           onChange={handleInputChange}
//                           placeholder="e.g. Special 20% OFF, Buy 1 Get 1 Free"
//                           className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-3 pt-4 border-t border-neutral-150 dark:border-neutral-800 shrink-0">
//                   <button
//                     type="button"
//                     onClick={() => setIsModalOpen(false)}
//                     className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
//                   >
//                     {editingSlide ? 'Save Changes' : 'Create Slide'}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default AdminHero;



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Link2 } from 'lucide-react';
import { getAllSlides, createSlide, updateSlide, deleteSlide } from '../../services/heroSlidesService';
import { getAllFoods } from '../../services/foodsService';

export const AdminHero = () => {
  const [slides, setSlides] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'promo',
    title: '',
    subtitle: '',
    image: '',
    cta: 'Order Now',
    featuredFoodId: '',
    offerText: ''
  });
  const [formError, setFormError] = useState('');

  const fetchSlides = () => {
    setLoading(true);
    Promise.all([getAllSlides(), getAllFoods()]).then(([slidesData, foodsData]) => {
      setSlides(slidesData);
      setFoods(foodsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openAddModal = () => {
    setEditingSlide(null);
    setFormData({
      type: 'promo',
      title: '',
      subtitle: '',
      image: '', 
      cta: 'Order Now',
      featuredFoodId: '',
      offerText: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      type: slide.type,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      cta: slide.cta || '',
      featuredFoodId: slide.featuredFoodId || '',
      offerText: slide.offerText || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      //  Max 2MB Validation
      if (file.size > 2 * 1024 * 1024) {
        setFormError("File size should be less than 2MB");
        return;
      }

      setFormError(''); // Clear error if file is valid
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result, 
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.image) {
      setFormError('Please fill in Slide Title and upload a background Image.');
      return;
    }

    try {
      const payload = {
        ...formData,
        featuredFoodId: formData.type === 'promo' && formData.featuredFoodId ? parseInt(formData.featuredFoodId, 10) : null,
        cta: formData.type === 'promo' ? formData.cta || 'Order Now' : null,
        offerText: formData.type === 'promo' ? formData.offerText || '' : null
      };

      if (editingSlide) {
        await updateSlide(editingSlide.id, payload);
      } else {
        await createSlide(payload);
      }
      setIsModalOpen(false);
      fetchSlides();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this hero slide?')) {
      await deleteSlide(id);
      fetchSlides();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
            Hero Carousel Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage the homepage carousel slides. Toggle between food advertisements and general restaurant photos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-500/10 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>

      {/* Grid of slides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => {
          const linkedDish = foods.find((f) => f.id === slide.featuredFoodId);
          return (
            <div
              key={slide.id}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image container */}
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-950">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Slide Type Badge */}
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${
                    slide.type === 'promo' 
                      ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {slide.type === 'promo' ? 'Food Ad Slide' : 'Atmosphere Photo'}
                  </span>

                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <h4 className="font-semibold text-sm truncate">{slide.title}</h4>
                    <p className="text-[10px] text-neutral-300 truncate font-light mt-0.5">{slide.subtitle}</p>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 space-y-3.5">
                  {slide.type === 'promo' && (
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-2.5 rounded-xl w-full">
                      <Link2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold">Featured Dish Link:</span>
                        <span className="block font-medium truncate text-neutral-700 dark:text-neutral-300 mt-0.5">
                          {linkedDish ? `${linkedDish.name} (৳${linkedDish.price})` : 'No dish linked'}
                        </span>
                        {slide.offerText && (
                          <span className="block text-[10px] font-bold text-red-500 mt-1">
                            Offer: {slide.offerText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {slide.type === 'ambient' && (
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 italic p-1">
                      * Ambient atmosphere slide. Will not display an Order button on home page.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-950/20">
                <button
                  onClick={() => openEditModal(slide)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Slide
                </button>

                <button
                  onClick={() => handleDeleteClick(slide.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-10 p-6 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-150 dark:border-neutral-800 shrink-0">
                <h3 className="text-lg font-bold font-display text-neutral-800 dark:text-white">
                  {editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 text-xs shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto py-4 flex-1 pr-1">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'promo' }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.type === 'promo'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
                      }`}
                    >
                      Food Advertisement (Promo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'ambient' }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.type === 'ambient'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-white'
                      }`}
                    >
                      Interior/Atmosphere (Ambient)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Savor the Art of Modern Dining"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slide Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Where culinary creativity meets sophisticated atmosphere."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Background Image
                  </label>
                  <div className="space-y-3">
                    
                    {formData.image && (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-900 text-white transition-all backdrop-blur-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    
                    <label className="flex flex-col items-center justify-center w-full min-h-[110px] border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-all p-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1 text-neutral-500 dark:text-neutral-400">
                        <ImageIcon className="w-5 h-5 text-neutral-400 mb-0.5" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {formData.image ? 'Change Image' : 'Upload Slide Image'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Supports JPG, PNG (Max 2MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {formData.type === 'promo' && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-850 rounded-2xl space-y-4">
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Promo Configuration
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                          Button CTA Text
                        </label>
                        <input
                          type="text"
                          name="cta"
                          value={formData.cta}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                          Link to Food Dish
                        </label>
                        <select
                          name="featuredFoodId"
                          value={formData.featuredFoodId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                        >
                          <option value="">-- Select Dish --</option>
                          {foods.map((food) => (
                            <option key={food.id} value={food.id}>
                              {food.name} (৳{food.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                          Offer / Discount Text
                        </label>
                        <input
                          type="text"
                          name="offerText"
                          value={formData.offerText}
                          onChange={handleInputChange}
                          placeholder="e.g. Special 20% OFF, Buy 1 Get 1 Free"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-805 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-150 dark:border-neutral-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
                  >
                    {editingSlide ? 'Save Changes' : 'Create Slide'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminHero;
