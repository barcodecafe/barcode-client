import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Ban, XCircle } from 'lucide-react';
import { apiBaseUrl } from '../services/paymentsService';

// Stand-in for SSLCommerz's hosted page, used only when the server runs in demo
// mode (no store credentials configured). It behaves exactly like the real
// gateway: it sends the browser to the server's return URL, which settles the
// payment and redirects on to the result page — so the flow we test here is the
// same flow that runs in production.
export const PaymentDemo = () => {
  const [params] = useSearchParams();
  const tranId = params.get('tran_id') || '';
  const amount = params.get('amount') || '';

  const go = (outcome) => {
    window.location.href = `${apiBaseUrl()}/payments/${outcome}?tran_id=${encodeURIComponent(tranId)}`;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-center">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Demo gateway — no real payment
          </p>
        </div>

        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-neutral-800 dark:text-white">
            Secure Payment (Demo)
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            This stands in for the SSLCommerz page while the store credentials aren't configured.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Amount</span>
              <span className="font-bold text-neutral-800 dark:text-white">৳{amount}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 dark:text-neutral-400">Transaction</span>
              <span className="font-mono text-neutral-400 break-all">{tranId}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => go('success')}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4" /> Pay ৳{amount}
            </button>
            <button
              onClick={() => go('fail')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:border-red-400 hover:text-red-500 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" /> Simulate failure
            </button>
            <button
              onClick={() => go('cancel')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-neutral-400 font-semibold text-xs hover:text-neutral-600 dark:hover:text-neutral-200 transition-all"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel payment
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentDemo;
