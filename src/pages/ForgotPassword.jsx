import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import apiClient from '../services/apiClient';

const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Step 1: Request OTP, Step 2: Verify OTP & Reset Password
  const [step, setStep] = useState(1); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const phoneValid = BD_PHONE.test(phone.trim());

  // Step 1: Request Email OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneValid) {
      Swal.fire({ icon: 'warning', title: 'Invalid Mobile Number', text: 'Please enter a valid BD phone number.', confirmButtonColor: '#f97316' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/auth/forgot-password/request-otp', { phone: phone.trim() });
      const emailHint = res.data?.data?.maskedEmail || 'your registered email';
      setMaskedEmail(emailHint);
      setStep(2);

      Swal.fire({
        icon: 'info',
        title: 'OTP Sent!',
        text: `A 6-digit OTP code has been sent to ${emailHint}.`,
        confirmButtonColor: '#f97316',
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(msg);

      if (err?.response?.status === 400 && msg.toLowerCase().includes('no email')) {
        Swal.fire({
          icon: 'warning',
          title: 'No Email Linked',
          text: 'There is no email associated with this account. Please contact Customer Support to reset your password.',
          confirmButtonColor: '#f97316',
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Request Failed', text: msg, confirmButtonColor: '#ef4444' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      Swal.fire({ icon: 'warning', title: 'Invalid OTP', text: 'Please enter the 6-digit OTP code.', confirmButtonColor: '#f97316' });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must be at least 8 characters long.', confirmButtonColor: '#f97316' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords Mismatch', text: 'Passwords do not match.', confirmButtonColor: '#f97316' });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password/reset', {
        phone: phone.trim(),
        otp: otp.trim(),
        newPassword,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: 'You can now log in with your new password.',
        timer: 2000,
        showConfirmButton: false,
      });

      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password. Invalid or expired OTP.';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Reset Failed', text: msg, confirmButtonColor: '#ef4444' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* 🎯 Global site-container class applied */
    <div className="site-container min-h-[calc(100vh-5rem)] flex items-center justify-center py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {step === 1
              ? 'Enter your registered mobile number. We will send a 6-digit OTP code to the email address linked with your account.'
              : `Enter the 6-digit OTP code sent to ${maskedEmail}`}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Phone Form */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 flex items-start gap-1">
                  <span>💡 <strong>Note:</strong> The OTP code will be sent to the email address registered with this mobile number.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={!phoneValid || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Email OTP'}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP & Password Reset Form */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-neutral-400 hover:underline pt-2 text-center block"
              >
                ← Change Mobile Number
              </button>
            </form>
          )}

          <p className="text-center text-sm text-neutral-500 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;