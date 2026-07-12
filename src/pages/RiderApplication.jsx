import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bike, 
  Upload, 
  FileText, 
  User, 
  Phone, 
  CreditCard, 
  Briefcase, 
  Loader2, 
  CheckCircle, 
  X, 
  AlertCircle, 
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'barcode_rider_applications';

export const RiderApplication = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [phoneVal, setPhoneVal] = useState(user?.phone || '');
  const [nid, setNid] = useState('');
  const [experience, setExperience] = useState('');
  const [expYears, setExpYears] = useState('1');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [license, setLicense] = useState(null);
  const [licenseName, setLicenseName] = useState('');

  // UI/UX states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [myApplication, setMyApplication] = useState(null);

  // Fetch application if exists
  const loadApplication = () => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const apps = JSON.parse(raw);
        const userApp = apps.find(a => a.userId === user.id);
        if (userApp) {
          setMyApplication(userApp);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [user]);

  // Set prefill phone when user changes
  useEffect(() => {
    if (user?.phone) {
      setPhoneVal(user.phone);
    }
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file for your profile photo.');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Please upload your driving license in PDF format.');
        return;
      }
      setLicenseName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicense(reader.result); // Base64 PDF
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneVal.trim() || !nid.trim() || !experience.trim()) {
      setError('Please fill in all textual fields.');
      return;
    }

    if (!photoPreview) {
      setError('Please upload a profile photo.');
      return;
    }

    if (!license) {
      setError('Please upload your driving license PDF.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newApp = {
        id: `app_${Date.now()}`,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: phoneVal.trim(),
        nid: nid.trim(),
        experience: experience.trim(),
        expYears,
        photo: photoPreview,
        licenseName,
        licensePdf: license,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const raw = localStorage.getItem(STORAGE_KEY);
      const apps = raw ? JSON.parse(raw) : [];
      
      // Remove any previous application for this user
      const filteredApps = apps.filter(a => a.userId !== user.id);
      filteredApps.push(newApp);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredApps));
      
      setMyApplication(newApp);
      setSubmitSuccess(true);
      
      // Reset form
      setNid('');
      setExperience('');
      setPhoto(null);
      setPhotoPreview(null);
      setLicense(null);
      setLicenseName('');
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Not Authenticated View
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
            <Bike className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">
            Join Our Rider Fleet
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
            Deliver happiness and earn on your schedule! Please log in or create a standard user account first to submit your rider recruitment application.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Link 
              to="/login"
              className="py-3 rounded-xl border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 font-bold text-sm text-neutral-700 dark:text-neutral-200 transition-all text-center"
            >
              Log In
            </Link>
            <Link 
              to="/signup"
              className="py-3 rounded-xl bg-primary-500 hover:bg-primary-600 font-bold text-sm text-white shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-center"
            >
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Already Rider View
  if (user?.role === 'rider') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">
            You're Already a Rider!
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
            Your rider profile is fully active. Head over to the Rider Portal to manage delivery tasks and track customer orders.
          </p>

          <Link 
            to="/rider"
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 font-bold text-sm text-white shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            Go to Rider Portal
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // 3. Admin View
  if (user?.role === 'admin') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">
            Administrator Account
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
            As an Administrator, you cannot apply to be a rider. You can inspect pending rider applications directly from the Admin Dashboard review panel.
          </p>

          <Link 
            to="/admin/rider-applications"
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-sm text-white shadow-lg shadow-indigo-650/20 active:scale-95 transition-all"
          >
            Review Rider Applications
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // 4. Pending / Under Review Application
  if (myApplication && myApplication.status === 'pending') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Bike className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">
              Application Under Review
            </h1>
            <p className="text-sm text-neutral-505 dark:text-neutral-400 mt-3 leading-relaxed">
              We have received your rider application! Our administrator registry team is reviewing your profile and credentials. We will notify you once approved.
            </p>
          </div>

          <div className="mt-8 border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-4 text-sm">
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Submitted Information Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl">
                <span className="text-neutral-450 block mb-0.5">Full Name</span>
                <span className="font-bold text-neutral-750 dark:text-neutral-205">{myApplication.name}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl">
                <span className="text-neutral-450 block mb-0.5">Contact No</span>
                <span className="font-bold text-neutral-750 dark:text-neutral-205">{myApplication.phone}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl col-span-2">
                <span className="text-neutral-450 block mb-0.5">NID Card Number</span>
                <span className="font-mono font-bold text-neutral-750 dark:text-neutral-205">{myApplication.nid}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl">
                <span className="text-neutral-450 block mb-0.5">Experience</span>
                <span className="font-bold text-neutral-750 dark:text-neutral-205">{myApplication.expYears} Years</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl">
                <span className="text-neutral-450 block mb-0.5">License File</span>
                <span className="font-bold text-primary-500 truncate block" title={myApplication.licenseName}>
                  {myApplication.licenseName}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-2.5 mt-4 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>While your application is pending, you can continue browsing the menu or tracking your customer orders.</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 5. Form (No application, or Rejected re-application)
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <Bike className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          Become a Barcode Delivery Rider
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 max-w-md mx-auto">
          Apply to join our premium food logistics fleet. Complete the form below with your credentials.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 sm:p-8 shadow-sm">
        {myApplication && myApplication.status === 'rejected' && (
          <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Previous Application Declined</span>
              <span className="text-xs">Your previous application was declined. You may review your details and re-apply with corrected document attachments.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact No */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value)}
                  placeholder="+8801700000000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* NID No */}
            <div>
              <label htmlFor="nid" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                National ID (NID) Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="nid"
                  type="text"
                  required
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="e.g. 19954203120..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm font-mono"
                />
              </div>
            </div>

            {/* Experience Years */}
            <div>
              <label htmlFor="expYears" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Years of Delivery Experience
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select
                  id="expYears"
                  value={expYears}
                  onChange={(e) => setExpYears(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer appearance-none"
                >
                  <option value="0">No Experience (Fresh Start)</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5+ Years</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Exp Details */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Brief Description of Experience
              </label>
              <input
                id="experience"
                type="text"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Worked at Pathao/Foodpanda for 2 years"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Profile Photo (Image File)
              </label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 transition-colors relative h-40">
                {photoPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-650 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-350">Click to Upload Photo</span>
                    <span className="text-[10px] text-neutral-400 mt-1">PNG, JPG, JPEG</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* License upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Driving License File (PDF)
              </label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 transition-colors relative h-40">
                {license ? (
                  <div className="text-center p-2 flex flex-col items-center justify-center">
                    <FileCheck className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate max-w-[200px] block">
                      {licenseName}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setLicense(null); setLicenseName(''); }}
                      className="mt-2 text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      Remove PDF
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <FileText className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-350">Upload Driving License</span>
                    <span className="text-[10px] text-neutral-400 mt-1">PDF File Only</span>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleLicenseChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Rider Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderApplication;
