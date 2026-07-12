import { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/authService';

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((data) => {
      setCustomers(data.filter((u) => u.role === 'user'));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Customers Registry
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Registered customer accounts profile directory including contact info, region, and addresses.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/40">
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Pick Area</th>
                <th className="px-4 py-3">Detailed Address</th>
                <th className="px-4 py-3">Signup Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                  <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                    {c.id.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-3.5 font-bold text-neutral-800 dark:text-neutral-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-350">
                    {c.email}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-neutral-800 dark:text-neutral-200">
                    {c.phone || <span className="text-neutral-450 font-light italic">Not Set</span>}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-primary-500">
                    {c.pickArea || <span className="text-neutral-450 font-light italic">Not Set</span>}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-605 dark:text-neutral-300 font-light truncate max-w-xs">
                    {c.address || <span className="text-neutral-450 font-light italic">Not Set</span>}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-450 dark:text-neutral-500 font-light">
                    {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
