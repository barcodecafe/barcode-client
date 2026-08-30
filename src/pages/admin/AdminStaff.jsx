import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Shield,
  UserCheck,
  KeyRound,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Mail,
  Phone,
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  Map,
  Building2,
  ShoppingBag,
  Bike,
  MessageSquarePlus,
  Tag,
  Truck,
  Image,
  Info,
  Settings,
  Sparkles,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
} from '../../services/staffService';

export const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard Overview', desc: 'Analytics, revenue, orders chart', icon: LayoutDashboard, category: 'Analytics' },
  { key: 'orders', label: 'Orders Management', desc: 'Live orders, status, kitchen flow', icon: ShoppingBag, category: 'Operations' },
  { key: 'dishes', label: 'Dishes & Menu', desc: 'Add/edit items, pricing, categories', icon: UtensilsCrossed, category: 'Operations' },
  { key: 'brands', label: 'Brands Management', desc: 'Restaurant brands & logos', icon: Store, category: 'Operations' },
  { key: 'regions', label: 'Regions & Zones', desc: 'Delivery areas & charge rates', icon: Map, category: 'Operations' },
  { key: 'branches', label: 'Branches & Outlets', desc: 'Outlet locations, operating hours', icon: Building2, category: 'Operations' },
  { key: 'fleet', label: 'Rider Fleet & Settlements', desc: 'Live rider tracking, cash handover', icon: Bike, category: 'Logistics' },
  { key: 'add_rider', label: 'Register New Rider', desc: 'Create delivery rider accounts', icon: UserPlus, category: 'Logistics' },
  { key: 'rider_applications', label: 'Rider Applications', desc: 'Review & approve rider signups', icon: Bike, category: 'Logistics' },
  { key: 'customers', label: 'Customer Directory', desc: 'Customer list & loyalty points', icon: Users, category: 'Customers' },
  { key: 'reviews', label: 'Customer Reviews', desc: 'Moderate dish ratings & feedbacks', icon: MessageSquarePlus, category: 'Customers' },
  { key: 'coupons', label: 'Discount Coupons', desc: 'Promo codes & percentage rules', icon: Tag, category: 'Marketing' },
  { key: 'free_delivery', label: 'Free Delivery Campaigns', desc: 'Minimum order amount rules', icon: Truck, category: 'Marketing' },
  { key: 'hero', label: 'Hero Banner Slider', desc: 'Homepage carousel slides', icon: Image, category: 'Content' },
  { key: 'about', label: 'About & Leadership', desc: 'Company story & leadership bios', icon: Info, category: 'Content' },
  { key: 'policies', label: 'Policies & Terms', desc: 'Terms of service & privacy', icon: ShieldCheck, category: 'Content' },
  { key: 'settings', label: 'System Site Settings', desc: 'Delivery fees, timings, tax', icon: Settings, category: 'System' },
  { key: 'staff_management', label: 'Staff & Roles Control', desc: 'Manage sub-admins and permissions', icon: Shield, category: 'System' },
];

export const AdminStaff = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // null = add new
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    permissions: [],
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaffUsers();
      if (Array.isArray(data)) {
        setStaffList(data);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'super_admin' && ['super_admin', 'superadmin'].includes(s.role)) ||
        (roleFilter === 'admin' && s.role === 'admin') ||
        (roleFilter === 'manager' && ['manager', 'restaurant_manager'].includes(s.role));

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q));

      return matchRole && matchQuery;
    });
  }, [staffList, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = staffList.length;
    const superAdmins = staffList.filter((s) => ['super_admin', 'superadmin'].includes(s.role)).length;
    const subAdmins = staffList.filter((s) => s.role === 'admin').length;
    const managers = staffList.filter((s) => ['manager', 'restaurant_manager'].includes(s.role)).length;
    return { total, superAdmins, subAdmins, managers };
  }, [staffList]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'admin',
      permissions: ALL_PERMISSIONS.map((p) => p.key).filter((k) => k !== 'staff_management'),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    const isSuper = ['super_admin', 'superadmin'].includes(staff.role);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '', // leave empty to keep unchanged
      role: staff.role || 'admin',
      permissions: isSuper
        ? ALL_PERMISSIONS.map((p) => p.key)
        : Array.isArray(staff.permissions)
        ? staff.permissions
        : [],
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permKey) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permKey);
      const nextPerms = exists
        ? prev.permissions.filter((k) => k !== permKey)
        : [...prev.permissions, permKey];
      return { ...prev, permissions: nextPerms };
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map((p) => p.key),
    }));
  };

  const handleClearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error('Either Email or Phone number is required');
      return;
    }
    if (!editingStaff && !formData.password.trim()) {
      toast.error('Password is required for new staff account');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        permissions: ['super_admin', 'superadmin'].includes(formData.role)
          ? ALL_PERMISSIONS.map((p) => p.key)
          : formData.permissions,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingStaff) {
        const id = editingStaff.id || editingStaff._id;
        await updateStaffUser(id, payload);
        toast.success('Staff role and permissions updated successfully!');
      } else {
        await createStaffUser(payload);
        toast.success('New staff member added successfully!');
      }

      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      console.error('Error saving staff:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staff) => {
    const id = staff.id || staff._id;
    const result = await Swal.fire({
      title: 'Delete Staff Member?',
      text: `Are you sure you want to remove ${staff.name} (${staff.role})? They will lose all access immediately.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e02424',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Staff',
    });

    if (result.isConfirmed) {
      try {
        await deleteStaffUser(id);
        toast.success('Staff member removed successfully');
        loadStaff();
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to delete staff member');
      }
    }
  };

  const getRoleBadge = (role) => {
    if (['super_admin', 'superadmin'].includes(role)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Sparkles className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Shield className="w-3 h-3" />
          Sub-Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <UserCheck className="w-3 h-3" />
        Restaurant Manager
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-xs">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-primary-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Security & Access Control
          </span>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
            Staff & Role Permissions
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Configure Super Admin, Sub-Admins, and Restaurant Managers. Select exactly which dashboard tabs and features each role can access.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">{stats.total}</div>
            <div className="text-[11px] font-bold text-neutral-400">Total Staff Members</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">{stats.superAdmins}</div>
            <div className="text-[11px] font-bold text-neutral-400">Super Admins</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">{stats.subAdmins}</div>
            <div className="text-[11px] font-bold text-neutral-400">Sub-Admins</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">{stats.managers}</div>
            <div className="text-[11px] font-bold text-neutral-400">Restaurant Managers</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'All Staff' },
            { key: 'super_admin', label: 'Super Admins' },
            { key: 'admin', label: 'Sub-Admins' },
            { key: 'manager', label: 'Managers' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                roleFilter === tab.key
                  ? 'bg-primary-500 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Members List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-neutral-400">Loading staff records...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <ShieldCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
            <h3 className="text-sm font-black text-neutral-700 dark:text-neutral-300">No staff members found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No staff members match the selected search query or role filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredStaff.map((staff) => {
              const staffId = staff.id || staff._id;
              const isSuper = ['super_admin', 'superadmin'].includes(staff.role);
              const perms = isSuper
                ? ALL_PERMISSIONS.map((p) => p.key)
                : Array.isArray(staff.permissions)
                ? staff.permissions
                : [];

              const isMe = String(currentUser?.id || currentUser?._id) === String(staffId);

              return (
                <div
                  key={staffId}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/30 transition-all"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-amber-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
                      {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                          {staff.name}
                        </h3>
                        {getRoleBadge(staff.role)}
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200">
                            (You)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                        {staff.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-400" />
                            {staff.email}
                          </span>
                        )}
                        {staff.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            {staff.phone}
                          </span>
                        )}
                      </div>

                      {/* Permissions Preview Tags */}
                      <div className="pt-2">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-900/50">
                            <Sparkles className="w-3 h-3" />
                            Unrestricted Full Access (All {ALL_PERMISSIONS.length} Tabs)
                          </span>
                        ) : perms.length === 0 ? (
                          <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                            No active module permissions granted
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-black text-neutral-600 dark:text-neutral-300">
                              Permissions ({perms.length}):
                            </span>
                            {perms.slice(0, 5).map((pKey) => {
                              const pObj = ALL_PERMISSIONS.find((p) => p.key === pKey);
                              return (
                                <span
                                  key={pKey}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                >
                                  {pObj ? pObj.label : pKey}
                                </span>
                              );
                            })}
                            {perms.length > 5 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                                +{perms.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-900/60">
                          <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Master Account</span>
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Permissions</span>
                          </button>

                          {!isMe && (
                            <button
                              onClick={() => handleDelete(staff)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/80 text-red-600 dark:text-red-400 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                              title="Delete Staff"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                    {editingStaff ? 'Update Permissions' : 'New Staff Account'}
                  </span>
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">
                    {editingStaff ? `Edit ${editingStaff.name}` : 'Add Staff / Manager'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
                {/* Account Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Account Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Role Type *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setFormData({
                            ...formData,
                            role: newRole,
                            permissions: ['super_admin', 'superadmin'].includes(newRole)
                              ? ALL_PERMISSIONS.map((p) => p.key)
                              : formData.permissions,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500 font-bold"
                      >
                        <option value="manager">Restaurant Manager</option>
                        <option value="admin">Sub-Admin</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="staff@barcode.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01700000000"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        {editingStaff ? 'Change Password (Leave blank to keep current)' : 'Password *'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="password"
                          required={!editingStaff}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingStaff ? '••••••••' : 'Enter secure password'}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary-500" />
                        Dashboard Tab Access Permissions
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Tick the tabs and modules this staff member is allowed to see and manage.
                      </p>
                    </div>

                    {!['super_admin', 'superadmin'].includes(formData.role) && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllPermissions}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3 text-primary-500" />
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllPermissions}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 text-neutral-400" />
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {['super_admin', 'superadmin'].includes(formData.role) ? (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                      <p className="text-xs font-bold text-purple-800 dark:text-purple-300">
                        Super Administrators automatically receive full, unrestricted access to all 18 tabs and platform controls.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = formData.permissions.includes(perm.key);
                        const Icon = perm.icon;

                        return (
                          <div
                            key={perm.key}
                            onClick={() => handleTogglePermission(perm.key)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                              isChecked
                                ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-500/80 shadow-xs'
                                : 'bg-neutral-50/70 dark:bg-neutral-950/40 border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isChecked
                                  ? 'bg-primary-500 text-white'
                                  : 'border-2 border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-primary-500' : 'text-neutral-400'}`} />
                                <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                                  {perm.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                                {perm.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{editingStaff ? 'Save Changes' : 'Create Staff Member'}</span>
                      </>
                    )}
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

export default AdminStaff;
