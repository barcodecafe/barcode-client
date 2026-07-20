import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Ban, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { getPaymentStatus, initPayment } from '../services/paymentsService';

// Where the gateway lands the customer after paying. The server has already
// verified and settled the payment from SSLCommerz's callback — this page only
// reports the outcome and confirms it against the order's real payment status.
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    tint: 'text-emerald-500 bg-emerald-500/10',
    title: 'Payment successful',
    body: 'Thank you! Your payment has been received and your order is confirmed.',
  },
  fail: {
    icon: XCircle,
    tint: 'text-red-500 bg-red-500/10',
    title: 'Payment failed',
    body: "Your payment didn't go through. No money has been taken — you can try again.",
  },
  cancel: {
    icon: Ban,
    tint: 'text-amber-500 bg-amber-500/10',
    title: 'Payment cancelled',
    body: 'You cancelled the payment. Your order is still saved and unpaid.',
  },
};

export const PaymentResult = ({ variant = 'success' }) => {
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  const v = VARIANTS[variant] || VARIANTS.success;
  const Icon = v.icon;

  const [status, setStatus] = useState(null); // real payment status from the server
  const [checking, setChecking] = useState(!!orderId);
  const [retrying, setRetrying] = useState(false);

  // Confirm against the server — the redirect alone is never proof of payment.
  useEffect(() => {
    if (!orderId) { setChecking(false); return; }
    let cancelled = false;
    getPaymentStatus(orderId)
      .then((s) => { if (!cancelled) setStatus(s); })
      .catch(() => { /* not logged in / not owner — just show the generic message */ })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  const handleRetry = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      const { gatewayUrl } = await initPayment(orderId);
      if (gatewayUrl) { window.location.href = gatewayUrl; return; }
      throw new Error('No checkout link returned.');
    } catch (err) {
      console.error('Retry payment failed:', err);
      setRetrying(false);
    }
  };

  const paid = status?.paymentStatus === 'Paid';
  // A success redirect whose order still isn't Paid means the IPN hasn't landed
  // yet — say so honestly rather than claiming the money arrived.
  const pendingSettlement = variant === 'success' && status && !paid;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl shadow-sm p-8 text-center"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${v.tint}`}>
          <Icon className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          {v.title}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">{v.body}</p>

        {checking && (
          <p className="mt-4 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming with the server…
          </p>
        )}

        {pendingSettlement && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
            The gateway says it went through, but we haven't received the final confirmation yet.
            This usually clears within a minute — your order page will show "Paid" once it does.
          </div>
        )}

        {status && (
          <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            Payment status: <span className={`font-bold ${paid ? 'text-emerald-500' : 'text-amber-500'}`}>{status.paymentStatus}</span>
            {status.transactionId && (
              <div className="mt-1 font-mono text-[10px] text-neutral-400 break-all">Txn: {status.transactionId}</div>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2.5">
          {orderId && (
            <Link
              to={`/order-tracking/${orderId}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm active:scale-95 transition-all"
            >
              Track your order <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {variant !== 'success' && orderId && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm hover:border-primary-500 hover:text-primary-500 transition-all disabled:opacity-60"
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {retrying ? 'Opening gateway…' : 'Try payment again'}
            </button>
          )}

          <Link to="/menu" className="text-xs text-neutral-400 hover:text-primary-500 mt-1">
            Continue browsing the menu
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentResult;
