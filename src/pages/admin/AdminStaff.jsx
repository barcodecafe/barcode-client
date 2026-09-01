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
  Crown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
} from '../../services/staffService';
import { getAllBranches } from '../../services/branchesService';

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
  const [branches, setBranches] = useState([]);
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
    role: 'manager',
    permissions: [],
    assignedBranches: [],
  });

  const loadBranches = async () => {
    try {
      const res = await getAllBranches();
      const list = Array.isArray(res) ? res : res?.data || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

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
    loadBranches();
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

  // 🎯 Collapsible 3 Role Sections State (Super Admin, Sub-Admin, Restaurant Manager)
  const [expandedRoles, setExpandedRoles] = useState({
    super_admin: true,
    admin: true,
    manager: true,
  });

  useEffect(() => {
    if (searchQuery.trim() || roleFilter !== 'all') {
      setExpandedRoles({ super_admin: true, admin: true, manager: true });
    }
  }, [searchQuery, roleFilter]);

  const toggleRoleExpand = (roleKey) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  const toggleAllRoles = (expandState) => {
    setExpandedRoles({
      super_admin: expandState,
      admin: expandState,
      manager: expandState,
    });
  };

  // Group filtered staff into the 3 core role sections
  const roleSections = useMemo(() => {
    const superAdminsList = filteredStaff.filter((s) => ['super_admin', 'superadmin'].includes(s.role));
    const subAdminsList = filteredStaff.filter((s) => s.role === 'admin');
    const managersList = filteredStaff.filter((s) => ['manager', 'restaurant_manager'].includes(s.role));

    return [
      {
        key: 'super_admin',
        label: 'Super Admin',
        desc: 'Master full-access administrators across all platform modules',
        icon: Crown,
        badgeCls: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
        countBadgeCls: 'bg-primary-500 text-white shadow-xs shadow-primary-500/25',
        headerCls: 'hover:border-primary-500/50 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent',
        count: stats.superAdmins,
        filteredCount: superAdminsList.length,
        list: superAdminsList,
      },
      {
        key: 'admin',
        label: 'Sub-Admin',
        desc: 'Assigned managers with operational access and custom permissions',
        icon: Shield,
        badgeCls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700',
        countBadgeCls: 'bg-neutral-700 dark:bg-neutral-300 text-white dark:text-neutral-900',
        headerCls: 'hover:border-neutral-400 dark:hover:border-neutral-600 bg-gradient-to-r from-neutral-500/5 via-transparent to-transparent',
        count: stats.subAdmins,
        filteredCount: subAdminsList.length,
        list: subAdminsList,
      },
      {
        key: 'manager',
        label: 'Restaurant Manager',
        desc: 'Outlet branch supervisors for live orders, kitchen flow & menu control',
        icon: UserCheck,
        badgeCls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        countBadgeCls: 'bg-amber-500 text-white shadow-xs shadow-amber-500/25',
        headerCls: 'hover:border-amber-500/50 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent',
        count: stats.managers,
        filteredCount: managersList.length,
        list: managersList,
      },
    ].filter((sec) => {
      if (roleFilter === 'all') return true;
      if (roleFilter === 'super_admin') return sec.key === 'super_admin';
      if (roleFilter === 'admin') return sec.key === 'admin';
      if (roleFilter === 'manager') return sec.key === 'manager';
      return true;
    });
  }, [filteredStaff, stats, roleFilter]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'manager',
      permissions: ['orders', 'dishes', 'dashboard'],
      assignedBranches: [],
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
      role: staff.role || 'manager',
      permissions: isSuper
        ? ALL_PERMISSIONS.map((p) => p.key)
        : Array.isArray(staff.permissions)
        ? staff.permissions
        : [],
      assignedBranches: Array.isArray(staff.assignedBranches)
        ? staff.assignedBranches.map(Number)
        : [],
    });
    setIsModalOpen(true);
  };

  const handleToggleBranch = (branchId) => {
    const bId = Number(branchId);
    setFormData((prev) => {
      const current = Array.isArray(prev.assignedBranches) ? prev.assignedBranches : [];
      const exists = current.includes(bId);
      const next = exists ? current.filter((id) => id !== bId) : [...current, bId];
      return { ...prev, assignedBranches: next };
    });
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
        assignedBranches: ['manager', 'restaurant_manager'].includes(formData.role)
          ? formData.assignedBranches
          : [],
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

  // Brand-aligned role badges
  const getRoleBadge = (role) => {
    if (['super_admin', 'superadmin'].includes(role)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
          <Crown className="w-3 h-3 text-primary-500" />
          Super Admin
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          <Shield className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
          Sub-Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        <UserCheck className="w-3 h-3 text-amber-500" />
        Restaurant Manager
      </span>
    );
  };

  return (
    <div className="w-full max-w-full space-y-2.5 sm:space-y-3 2xl:space-y-4 pb-6 select-none">
      {/* 👑 Sleek Brand-Themed Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3 sm:p-4 2xl:p-5 shadow-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Access Control
          </span>
          <h1 className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-white leading-tight">
            Staff & Role Permissions
          </h1>
          <p className="text-[10px] sm:text-[11px] 2xl:text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Configure Super Admin, Sub-Admins, and Restaurant Managers. Manage dashboard tab access permissions.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 2xl:px-4 2xl:py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {/* 📊 Compact Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 2xl:gap-3.5">
        {/* Total Staff */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 2xl:p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold shrink-0">
            <Users className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-white leading-none">
              {stats.total}
            </div>
            <div className="text-[9px] sm:text-[10px] 2xl:text-[11px] font-bold text-neutral-400 truncate mt-0.5">Total Staff</div>
          </div>
        </div>

        {/* Super Admins */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 2xl:p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold shrink-0">
            <Crown className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-white leading-none">
              {stats.superAdmins}
            </div>
            <div className="text-[9px] sm:text-[10px] 2xl:text-[11px] font-bold text-neutral-400 truncate mt-0.5">Super Admins</div>
          </div>
        </div>

        {/* Sub-Admins */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 2xl:p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-white leading-none">
              {stats.subAdmins}
            </div>
            <div className="text-[9px] sm:text-[10px] 2xl:text-[11px] font-bold text-neutral-400 truncate mt-0.5">Sub-Admins</div>
          </div>
        </div>

        {/* Restaurant Managers */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 2xl:p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg 2xl:text-xl font-black text-neutral-900 dark:text-white leading-none">
              {stats.managers}
            </div>
            <div className="text-[9px] sm:text-[10px] 2xl:text-[11px] font-bold text-neutral-400 truncate mt-0.5">Managers</div>
          </div>
        </div>
      </div>

      {/* 🔍 Search & Role Filter Row */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="relative w-full sm:w-64 2xl:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'All Staff' },
            { key: 'super_admin', label: 'Super Admins' },
            { key: 'admin', label: 'Sub-Admins' },
            { key: 'manager', label: 'Managers' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
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

      {/* 👥 Staff Roles & Accounts Directory (3 Interactive Role Rows) */}
      <div className="w-full space-y-3">
        {/* Controls: Expand/Collapse All */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Account Groups by Role ({roleSections.length} Roles)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAllRoles(true)}
              className="text-[10px] sm:text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <button
              type="button"
              onClick={() => toggleAllRoles(false)}
              className="text-[10px] sm:text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-neutral-400">Loading staff records...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-1 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
            <h3 className="text-xs sm:text-sm font-black text-neutral-700 dark:text-neutral-300">No staff members found</h3>
            <p className="text-[10px] text-neutral-400 max-w-sm mx-auto">
              No staff members match the selected search query or role filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {roleSections.map((section) => {
              const isExpanded = !!expandedRoles[section.key];
              const IconComponent = section.icon;

              return (
                <div
                  key={section.key}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  {/* 🎯 Interactive Role Header Row (Click or Hover) */}
                  <div
                    onClick={() => toggleRoleExpand(section.key)}
                    className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all group ${section.headerCls} hover:bg-neutral-50/80 dark:hover:bg-neutral-850/50`}
                  >
                    {/* Left: Role Icon + Title + Description */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold border transition-transform group-hover:scale-105 shrink-0 ${section.badgeCls}`}
                      >
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xs sm:text-sm 2xl:text-base font-black text-neutral-900 dark:text-white">
                            {section.label}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${section.countBadgeCls}`}
                          >
                            {section.filteredCount}{' '}
                            {section.filteredCount === 1 ? 'Account' : 'Accounts'}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {section.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right: Expand Toggle Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 hidden sm:inline">
                        {isExpanded ? 'Hide accounts' : 'View accounts'}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 bg-primary-500/10 text-primary-500' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* 📂 Collapsible Accounts List under this Role */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-950/30 p-2 sm:p-2.5 space-y-2"
                      >
                        {section.list.length === 0 ? (
                          <div className="text-center py-4 text-neutral-400 text-xs font-medium">
                            No {section.label} accounts found matching current search.
                          </div>
                        ) : (
                          section.list.map((staff) => {
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
                                className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:border-primary-500/40 transition-all shadow-2xs"
                              >
                                {/* Left: Avatar + Details */}
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-primary-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shadow-primary-500/20 shrink-0">
                                    {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                                  </div>

                                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 flex-wrap">
                                    {/* Name */}
                                    <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate shrink-0">
                                      {staff.name}
                                    </h3>

                                    {/* Role Badge */}
                                    {getRoleBadge(staff.role)}

                                    {/* (You) Tag */}
                                    {isMe && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                                        (You)
                                      </span>
                                    )}

                                    {/* Contact Info */}
                                    {staff.email && (
                                      <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                                        <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                                        <span>{staff.email}</span>
                                      </span>
                                    )}

                                    {staff.phone && (
                                      <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                                        <span>{staff.phone}</span>
                                      </span>
                                    )}

                                    {/* Assigned Branches for Managers */}
                                    {['manager', 'restaurant_manager'].includes(staff.role) && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                          {Array.isArray(staff.assignedBranches) &&
                                          staff.assignedBranches.length > 0
                                            ? branches
                                                .filter((b) =>
                                                  staff.assignedBranches.includes(Number(b.id))
                                                )
                                                .map((b) => b.name)
                                                .join(', ') ||
                                              `Branch #${staff.assignedBranches.join(', #')}`
                                            : 'All Outlets'}
                                        </span>
                                      </div>
                                    )}

                                    {/* Permissions Tags */}
                                    <div className="flex items-center shrink-0">
                                      {isSuper ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-900/50">
                                          <Sparkles className="w-2.5 h-2.5 text-primary-500" />
                                          Full Access (All {ALL_PERMISSIONS.length} Tabs)
                                        </span>
                                      ) : perms.length === 0 ? (
                                        <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                          No perms
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-500">
                                            Perms ({perms.length}):
                                          </span>
                                          {perms.slice(0, 3).map((pKey) => {
                                            const pObj = ALL_PERMISSIONS.find((p) => p.key === pKey);
                                            return (
                                              <span
                                                key={pKey}
                                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-700"
                                              >
                                                {pObj ? pObj.label : pKey}
                                              </span>
                                            );
                                          })}
                                          {perms.length > 3 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                                              +{perms.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                {isSuperAdmin && (
                                  <div className="flex items-center gap-1 shrink-0 self-center">
                                    {isSuper ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] border border-neutral-200 dark:border-neutral-700">
                                        <Lock className="w-2.5 h-2.5 text-neutral-500" />
                                        <span>Master</span>
                                      </span>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleOpenEditModal(staff)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-[10px] sm:text-[11px] transition-all active:scale-95 cursor-pointer shadow-2xs"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>Edit</span>
                                        </button>

                                        {!isMe && (
                                          <button
                                            onClick={() => handleDelete(staff)}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/80 text-red-600 dark:text-red-400 font-bold transition-all active:scale-95 cursor-pointer"
                                            title="Delete Staff"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📝 Add / Edit Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                    {editingStaff ? 'Update Permissions' : 'New Staff Account'}
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    {editingStaff ? `Edit ${editingStaff.name}` : 'Add Staff / Manager'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-3.5 sm:p-4 space-y-3.5 flex-1">
                {/* Account Details */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-primary-500" />
                    Account Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500 font-bold"
                      >
                        <option value="manager">Restaurant Manager</option>
                        <option value="admin">Sub-Admin</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="staff@barcode.com"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01700000000"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        {editingStaff ? 'Change Password (Leave blank to keep current)' : 'Password *'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                          type="password"
                          required={!editingStaff}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingStaff ? '••••••••' : 'Enter secure password'}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branch Assignment (For Restaurant Managers) */}
                {['manager', 'restaurant_manager'].includes(formData.role) && (
                  <div className="space-y-2 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          Assigned Restaurant Branch / Outlet *
                        </h4>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          Select which branch(es) this manager will control. They will only see & manage orders, dishes, and metrics for selected branches.
                        </p>
                      </div>
                      {branches.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                          {formData.assignedBranches.length === 0
                            ? 'All Outlets (Global)'
                            : `${formData.assignedBranches.length} Branch(es) Selected`}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {branches.map((b) => {
                        const bId = Number(b.id);
                        const isSelected = formData.assignedBranches.includes(bId);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBranch(bId)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 select-none ${
                              isSelected
                                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 shadow-2xs'
                                : 'bg-neutral-50/70 dark:bg-neutral-950/40 border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-white'
                                  : 'border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-black text-neutral-900 dark:text-white truncate block">
                                {b.name}
                              </span>
                              <span className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate block">
                                {b.location || 'Outlet'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="space-y-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                        Dashboard Tab Access Permissions
                      </h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Tick the tabs and modules this staff member is allowed to see and manage.
                      </p>
                    </div>

                    {!['super_admin', 'superadmin'].includes(formData.role) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllPermissions}
                          className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckSquare className="w-2.5 h-2.5 text-primary-500" />
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllPermissions}
                          className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Square className="w-2.5 h-2.5 text-neutral-400" />
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {['super_admin', 'superadmin'].includes(formData.role) ? (
                    <div className="p-3 bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200/80 dark:border-primary-900/60 rounded-xl flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary-500 shrink-0" />
                      <p className="text-xs font-bold text-primary-800 dark:text-primary-300">
                        Super Administrators automatically receive full, unrestricted access to all 18 tabs and platform controls.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = formData.permissions.includes(perm.key);
                        const Icon = perm.icon;

                        return (
                          <div
                            key={perm.key}
                            onClick={() => handleTogglePermission(perm.key)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-start gap-2 select-none ${
                              isChecked
                                ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-500/80 shadow-2xs'
                                : 'bg-neutral-50/70 dark:bg-neutral-950/40 border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isChecked
                                  ? 'bg-primary-500 text-white'
                                  : 'border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <Icon className={`w-3 h-3 ${isChecked ? 'text-primary-500' : 'text-neutral-400'}`} />
                                <span className="text-[11px] font-black text-neutral-900 dark:text-white">
                                  {perm.label}
                                </span>
                              </div>
                              <p className="text-[9px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
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
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-black text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {saving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 stroke-[2.5]" />
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
