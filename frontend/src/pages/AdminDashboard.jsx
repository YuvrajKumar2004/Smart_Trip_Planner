import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, Briefcase, Calendar, Users, BarChart3, LogOut,
  DollarSign, MapPin, Clock, Compass, Upload, Trash2, UsersRound, Percent,
  CheckCircle, TrendingUp, XCircle, Activity, ChevronRight, Menu, X, ShieldAlert,
  Sparkles, Info, Users2, CalendarDays
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyticsService, packageService, predefinedTripService, destinationService } from '../services';
import useAuthStore from '../store/authStore';
import { formatINR, formatINRShort } from '../utils/helpers';

const COLORS = ['#6c63ff', '#ff6584', '#43e97b', '#f9c74f', '#00d2ff', '#a78bfa', '#ff9f7f'];

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
};

// Crash-proof Date Formatting Utility
const safeFormatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (err) {
    return dateStr || '—';
  }
};

const unwrapApiData = (response) => response?.data?.data ?? response?.data ?? null;

const toSafeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const TAB_ROUTE_MAP = {
  dashboard: '/admin/dashboard',
  'add-package': '/admin/packages/new',
  'add-predefined': '/admin/predefined/new',
  'manage-packages': '/admin/packages',
  bookings: '/admin/bookings',
  users: '/admin/users',
  analytics: '/admin/analytics',
};

const getTabFromPath = (pathname) => {
  if (pathname.startsWith('/admin/packages/new')) return 'add-package';
  if (pathname.startsWith('/admin/predefined/new')) return 'add-predefined';
  if (pathname.startsWith('/admin/packages')) return 'manage-packages';
  if (pathname.startsWith('/admin/bookings')) return 'bookings';
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/analytics')) return 'analytics';
  return 'dashboard';
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  // Navigation state
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({
    title: '',
    destination: '',
    price: '',
    duration: '',
    description: '',
    imageUrl: '',
    availableSeats: 30,
    startDate: '',
    endDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  // Predefined trip form states
  const [predefForm, setPredefForm] = useState({
    title: '',
    description: '',
    category: '',
    pricePerPerson: '',
    durationDays: '',
    bestSeason: '',
    transportMode: '',
    imageUrl: '',
  });
  const [predefErrors, setPredefErrors] = useState({});
  const [predefSubmitting, setPredefSubmitting] = useState(false);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState([]);
  // Inline destination modal state
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [destForm, setDestForm] = useState({ name: '', description: '', category: '', avgCostPerPerson: '', state: '', country: '', imageUrls: [] });
  const [destErrors, setDestErrors] = useState({});
  const [destSubmitting, setDestSubmitting] = useState(false);

  // Load dashboard overview statistics, users, packages, bookings
  const loadDashboardData = async () => {
    const [dashRes, usersRes, pkgsRes, bookingsRes, destRes] = await Promise.allSettled([
      analyticsService.getDashboard(),
      analyticsService.getAllUsers(),
      packageService.getAll(),
      analyticsService.getAllBookings(),
      destinationService.getAll(),
    ]);

    const hasFailure = [dashRes, usersRes, pkgsRes, bookingsRes].some((res) => res.status === 'rejected');

    if (dashRes.status === 'fulfilled') {
      setStats(unwrapApiData(dashRes.value) || null);
    }
    if (usersRes.status === 'fulfilled') {
      setUsersList(toSafeArray(unwrapApiData(usersRes.value)));
    }
    if (pkgsRes.status === 'fulfilled') {
      setPackages(toSafeArray(unwrapApiData(pkgsRes.value)));
    }
    if (bookingsRes.status === 'fulfilled') {
      setBookings(toSafeArray(unwrapApiData(bookingsRes.value)));
    }
    if (destRes?.status === 'fulfilled') {
      setAvailableDestinations(toSafeArray(unwrapApiData(destRes.value)));
    }

    if (hasFailure) {
      console.error('One or more admin dashboard API calls failed', {
        dashboard: dashRes.status,
        users: usersRes.status,
        packages: pkgsRes.status,
        bookings: bookingsRes.status,
      });
      toast.error('Some dashboard data failed to load, but packages were refreshed');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const nextPath = TAB_ROUTE_MAP[tabId] || '/admin/dashboard';
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Form Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Base64 Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imageUrl: reader.result }));
      if (formErrors.imageUrl) {
        setFormErrors(prev => ({ ...prev, imageUrl: '' }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Image handler for predefined trip form (stores base64 string)
  const handlePredefImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPredefForm(prev => ({ ...prev, imageUrl: reader.result }));
      if (predefErrors.imageUrl) {
        setPredefErrors(prev => ({ ...prev, imageUrl: '' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, imageUrl: '' }));
  };
  const handleDestinationImages = (e) => {

    const files = Array.from(e.target.files);

    files.forEach(file => {

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {

        setDestForm(prev => ({
          ...prev,
          imageUrls: [
            ...prev.imageUrls,
            reader.result
          ]
        }));

      };

      reader.readAsDataURL(file);

    });
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Package Title is required';
    if (!form.destination.trim()) errors.destination = 'Destination is required';
    if (!form.price || parseFloat(form.price) <= 0) errors.price = 'Price must be greater than 0';
    if (!form.duration.trim()) errors.duration = 'Duration is required (e.g. 5 Days / 4 Nights)';
    if (!form.imageUrl) errors.imageUrl = 'Package image is required';
    if (!form.availableSeats || parseInt(form.availableSeats) < 0) errors.availableSeats = 'Seats cannot be negative';
    if (!form.startDate) errors.startDate = 'Start date is required';
    if (!form.endDate) errors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      errors.endDate = 'End date must be on or after start date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Trip Package Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the validation errors');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        availableSeats: parseInt(form.availableSeats),
      };

      await packageService.add(payload);
      toast.success('🎉 Trip Package added successfully!');
      
      // Reset form
      setForm({
        title: '',
        destination: '',
        price: '',
        duration: '',
        description: '',
        imageUrl: '',
        availableSeats: 30,
        startDate: '',
        endDate: '',
      });
      setFormErrors({});

      // Reload lists and move to package list for instant confirmation.
      await loadDashboardData();
      handleTabChange('manage-packages');
    } catch (err) {
      toast.error(err?.message || 'Failed to add travel package');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Predefined Trip form
  const validatePredefForm = () => {
    const errors = {};
    if (!predefForm.title.trim()) errors.title = 'Title is required';
    if (!predefForm.category) errors.category = 'Category is required';
    if (!predefForm.pricePerPerson || parseFloat(predefForm.pricePerPerson) <= 0) errors.pricePerPerson = 'Price must be greater than 0';
    if (selectedDestinationIds.length === 0) errors.destinationIds = 'Select at least one destination';
    setPredefErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePredefSubmit = async (e) => {
    e.preventDefault();
    if (!validatePredefForm()) {
      toast.error('Please correct the validation errors');
      return;
    }

    setPredefSubmitting(true);
    try {
      const payload = {
        title: predefForm.title,
        description: predefForm.description,
        category: predefForm.category,
        pricePerPerson: parseFloat(predefForm.pricePerPerson),
        durationDays: predefForm.durationDays ? parseInt(predefForm.durationDays) : undefined,
        bestSeason: predefForm.bestSeason || undefined,
        transportMode: predefForm.transportMode || undefined,
        destinationIds: selectedDestinationIds,
        imageUrls: predefForm.imageUrl ? [predefForm.imageUrl] : [],
      };

      await predefinedTripService.create(payload);
      toast.success('🎉 Predefined trip created successfully');

      // Reset form
      setPredefForm({ title: '', description: '', category: '', pricePerPerson: '', durationDays: '', bestSeason: '', transportMode: '', imageUrl: '' });
      setSelectedDestinationIds([]);
      setPredefErrors({});

      // Reload lists
      await loadDashboardData();
      handleTabChange('manage-packages');
    } catch (err) {
      toast.error(err?.message || 'Failed to create predefined trip');
    } finally {
      setPredefSubmitting(false);
    }
  };

  // Destination creation helpers (inline modal)
  const validateDestForm = () => {
    const errors = {};
    if (!destForm.name || !destForm.name.trim()) errors.name = 'Name is required';
    if (!destForm.category) errors.category = 'Category is required';
    if (!destForm.avgCostPerPerson || parseFloat(destForm.avgCostPerPerson) <= 0) errors.avgCostPerPerson = 'Average cost must be greater than 0';
    setDestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDestination = async (e) => {
    e && e.preventDefault();
    if (!validateDestForm()) {
      toast.error('Please correct the destination form errors');
      return;
    }

    setDestSubmitting(true);
    try {
      const payload = {
        name: destForm.name,
        description: destForm.description || undefined,
        category: destForm.category || undefined,
        avgCostPerPerson: parseFloat(destForm.avgCostPerPerson),
        state: destForm.state || undefined,
        country: destForm.country || undefined,
        imageUrls: destForm.imageUrls
      };

      const res = await destinationService.create(payload);
      const created = unwrapApiData(res) || res?.data?.data || res?.data || null;
      if (!created) throw new Error('Unexpected response from server');

      // Prepend and select the new destination
      setAvailableDestinations(prev => [created, ...prev]);
      setSelectedDestinationIds(prev => Array.from(new Set([...(prev || []), created.id])));

      toast.success('Destination created');
      setIsDestModalOpen(false);
      setDestForm({ name: '', description: '', category: '', avgCostPerPerson: '', state: '', country: '',imageUrls: [] });
      setDestErrors({});
    } catch (err) {
      console.error('Failed to create destination', err);
      toast.error(err?.message || 'Failed to create destination');
    } finally {
      setDestSubmitting(false);
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this package?')) return;
    try {
      await packageService.delete(id);
      toast.success('Package deleted successfully');
      loadDashboardData();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete package');
    }
  };

  if (loading) return <PageLoader />;

  // Statistic Cards mapping with defensive fallbacks
  const STAT_CARDS = stats ? [
    { label: 'Total Registered Users', value: toNumber(stats.totalUsers), icon: Users, color: '#6c63ff', change: '+12%', bg: 'rgba(108,99,255,0.08)' },
    { label: 'Total Platform Revenue', value: formatINR(toNumber(stats.totalRevenue)), icon: TrendingUp, color: '#43e97b', change: '+8%', bg: 'rgba(67,233,123,0.08)' },
    { label: 'Total Client Bookings', value: toNumber(stats.totalBookings), icon: Briefcase, color: '#f9c74f', change: '+23%', bg: 'rgba(249,199,79,0.08)' },
    { label: 'Active Trip Packages', value: packages.length || 0, icon: Compass, color: '#00d2ff', change: '+5%', bg: 'rgba(0,210,255,0.08)' },
  ] : [];

  const SIDEBAR_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-package', label: 'Add Package', icon: PlusCircle },
    { id: 'add-predefined', label: 'Add Predefined Trip', icon: Sparkles },
    { id: 'manage-packages', label: 'Manage Packages', icon: Compass },
    { id: 'bookings', label: 'Bookings', icon: Briefcase, count: bookings.length },
    { id: 'users', label: 'Users', icon: Users, count: usersList.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#f0f0f8] overflow-hidden" style={{ paddingTop: 80 }}>
      {/* Background Orbs */}
      <div className="orb orb-purple" style={{ top: '-10%', left: '10%', width: 500, height: 500 }} />
      <div className="orb orb-cyan" style={{ bottom: '-10%', right: '10%', width: 600, height: 600 }} />

      {/* --- Sidebar Navigation (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-[280px] bg-[#111118]/85 backdrop-blur-xl border-r border-white/5 p-6 flex-shrink-0 z-10">
        {/* Admin Meta */}
        <div className="flex items-center gap-4 mb-8 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#6c63ff] to-[#ff6584] flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(108,99,255,0.3)]">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight text-[#f0f0f8] truncate w-[160px]">{user?.name || 'Administrator'}</h4>
            <span className="text-[10px] text-[#43e97b] font-bold tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43e97b] animate-pulse" />
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#6c63ff]/15 border border-[#6c63ff]/30 text-[#6c63ff]'
                    : 'text-[#9898b3] hover:text-[#f0f0f8] hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-[#6c63ff]' : 'text-[#9898b3]'} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-[#6c63ff]/20 text-[#6c63ff]' : 'bg-white/5 text-[#9898b3]'
                  }`}>
                    {item.count}
                  </span>
                    )}

                  {/*/!* --- Add Predefined Trip Tab --- *!/*/}
                  {/*{activeTab === 'add-predefined' && (*/}
                  {/*  <motion.div key="add-predefined" {...pageTransition}>*/}
                  {/*    /!* Header *!/*/}
                  {/*    <div className="mb-8">*/}
                  {/*      <div className="flex items-center gap-2 mb-2">*/}
                  {/*        <Sparkles size={14} className="text-[#6c63ff]" />*/}
                  {/*        <span className="text-xs font-bold text-[#6c63ff] uppercase tracking-wider">Predefined Trips</span>*/}
                  {/*      </div>*/}
                  {/*      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">*/}
                  {/*        Add New <span className="gradient-text">Predefined Trip</span>*/}
                  {/*      </h1>*/}
                  {/*      <p className="text-sm text-[#9898b3]">Create a curated trip offering for users to browse and book</p>*/}
                  {/*    </div>*/}

                  {/*    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">*/}
                  {/*      <div className="lg:col-span-3 glass-card p-6 md:p-8">*/}
                  {/*        <form onSubmit={handlePredefSubmit} className="space-y-6">*/}
                  {/*          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">*/}
                  {/*            <div className="input-group">*/}
                  {/*              <label className="input-label">Title</label>*/}
                  {/*              <input*/}
                  {/*                type="text"*/}
                  {/*                name="title"*/}
                  {/*                value={predefForm.title}*/}
                  {/*                onChange={(e) => setPredefForm(prev => ({ ...prev, title: e.target.value }))}*/}
                  {/*                placeholder="e.g., Magical Kerala Backwaters"*/}
                  {/*                className={`input-field ${predefErrors.title ? 'error' : ''}`}*/}
                  {/*              />*/}
                  {/*              {predefErrors.title && <span className="input-error">{predefErrors.title}</span>}*/}
                  {/*            </div>*/}

                  {/*            <div className="input-group">*/}
                  {/*              <label className="input-label">Category</label>*/}
                  {/*              <select*/}
                  {/*                name="category"*/}
                  {/*                value={predefForm.category}*/}
                  {/*                onChange={(e) => setPredefForm(prev => ({ ...prev, category: e.target.value }))}*/}
                  {/*                className={`input-field ${predefErrors.category ? 'error' : ''}`}>*/}
                  {/*                <option value="">Select category</option>*/}
                  {/*                <option value="ADVENTURE">ADVENTURE</option>*/}
                  {/*                <option value="RELAXATION">RELAXATION</option>*/}
                  {/*                <option value="LUXURY">LUXURY</option>*/}
                  {/*                <option value="BUDGET">BUDGET</option>*/}
                  {/*                <option value="TREKKING">TREKKING</option>*/}
                  {/*                <option value="FAMILY">FAMILY</option>*/}
                  {/*                <option value="BACKPACKING">BACKPACKING</option>*/}
                  {/*              </select>*/}
                  {/*              {predefErrors.category && <span className="input-error">{predefErrors.category}</span>}*/}
                  {/*            </div>*/}
                  {/*          </div>*/}

                  {/*          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">*/}
                  {/*            <div className="input-group">*/}
                  {/*              <label className="input-label">Price per Person (₹)</label>*/}
                  {/*              <input*/}
                  {/*                type="number"*/}
                  {/*                name="pricePerPerson"*/}
                  {/*                value={predefForm.pricePerPerson}*/}
                  {/*                onChange={(e) => setPredefForm(prev => ({ ...prev, pricePerPerson: e.target.value }))}*/}
                  {/*                placeholder="e.g., 25000"*/}
                  {/*                className={`input-field ${predefErrors.pricePerPerson ? 'error' : ''}`}*/}
                  {/*              />*/}
                  {/*              {predefErrors.pricePerPerson && <span className="input-error">{predefErrors.pricePerPerson}</span>}*/}
                  {/*            </div>*/}

                  {/*            <div className="input-group">*/}
                  {/*              <label className="input-label">Duration (days)</label>*/}
                  {/*              <input*/}
                  {/*                type="number"*/}
                  {/*                name="durationDays"*/}
                  {/*                value={predefForm.durationDays}*/}
                  {/*                onChange={(e) => setPredefForm(prev => ({ ...prev, durationDays: e.target.value }))}*/}
                  {/*                placeholder="e.g., 5"*/}
                  {/*                className="input-field"*/}
                  {/*              />*/}
                  {/*            </div>*/}

                  {/*            <div className="input-group">*/}
                  {/*              <label className="input-label">Transport Mode</label>*/}
                  {/*              <select*/}
                  {/*                name="transportMode"*/}
                  {/*                value={predefForm.transportMode}*/}
                  {/*                onChange={(e) => setPredefForm(prev => ({ ...prev, transportMode: e.target.value }))}*/}
                  {/*                className="input-field">*/}
                  {/*                <option value="">Select transport</option>*/}
                  {/*                <option value="FLIGHT">FLIGHT</option>*/}
                  {/*                <option value="TRAIN">TRAIN</option>*/}
                  {/*                <option value="BUS">BUS</option>*/}
                  {/*                <option value="CAR">CAR</option>*/}
                  {/*                <option value="MIXED">MIXED</option>*/}
                  {/*              </select>*/}
                  {/*            </div>*/}
                  {/*          </div>*/}

                  {/*          <div className="input-group">*/}
                  {/*            <label className="input-label">Description</label>*/}
                  {/*            <textarea*/}
                  {/*              name="description"*/}
                  {/*              rows={4}*/}
                  {/*              value={predefForm.description}*/}
                  {/*              onChange={(e) => setPredefForm(prev => ({ ...prev, description: e.target.value }))}*/}
                  {/*              placeholder="Short description for travelers"*/}
                  {/*              className="input-field resize-none"*/}
                  {/*            />*/}
                  {/*          </div>*/}

                  {/*          /!* Destination multi-select *!/*/}
                  {/*          <div className="input-group">*/}
                  {/*            <div className="flex items-center justify-between">*/}
                  {/*              <label className="input-label">Destinations (select one or more)</label>*/}
                  {/*              <button type="button" onClick={() => setIsDestModalOpen(true)} className="text-xs text-[#6c63ff] hover:underline flex items-center gap-2">*/}
                  {/*                <PlusCircle size={14} />*/}
                  {/*                <span className="font-semibold">Add destination</span>*/}
                  {/*              </button>*/}
                  {/*            </div>*/}
                  {/*            /!* Searchable multi-select *!/*/}
                  {/*            <div>*/}
                  {/*              <Select*/}
                  {/*                isMulti*/}
                  {/*                options={availableDestinations.map(d => ({ value: d.id, label: `${d.name}${d.state ? ' · ' + d.state : ''}` }))}*/}
                  {/*                value={availableDestinations*/}
                  {/*                  .map(d => ({ value: d.id, label: `${d.name}${d.state ? ' · ' + d.state : ''}` }))*/}
                  {/*                  .filter(opt => selectedDestinationIds.includes(opt.value))}*/}
                  {/*                onChange={(selected) => setSelectedDestinationIds(Array.isArray(selected) ? selected.map(s => s.value) : [])}*/}
                  {/*                placeholder={availableDestinations.length ? 'Search and select destinations...' : 'No destinations available'}*/}
                  {/*                className="react-select-container"*/}
                  {/*                classNamePrefix="react-select"*/}
                  {/*                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}*/}
                  {/*                menuPosition="fixed"*/}
                  {/*                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}*/}
                  {/*              />*/}
                  {/*              {predefErrors.destinationIds && <div className="input-error mt-2">{predefErrors.destinationIds}</div>}*/}
                  {/*            </div>*/}
                  {/*          </div>*/}

                  {/*          /!* Image upload *!/*/}
                  {/*          <div className="input-group">*/}
                  {/*            <label className="input-label mb-3 block">Feature Image</label>*/}
                  {/*            {!predefForm.imageUrl ? (*/}
                  {/*              <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${predefErrors.imageUrl ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-white/10 hover:border-[#6c63ff]/40 hover:bg-[#6c63ff]/2'}`}>*/}
                  {/*                <input type="file" accept="image/*" onChange={handlePredefImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />*/}
                  {/*                <Upload size={28} className="text-[#9898b3] mb-3" />*/}
                  {/*                <h4 className="font-semibold text-sm mb-1">Click or drag image to upload</h4>*/}
                  {/*                <p className="text-[10px] text-[#9898b3]">PNG, JPG or JPEG up to 2MB</p>*/}
                  {/*              </div>*/}
                  {/*            ) : (*/}
                  {/*              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video">*/}
                  {/*                <img src={predefForm.imageUrl} alt={predefForm.title} className="w-full h-full object-cover" />*/}
                  {/*                <button onClick={() => setPredefForm(prev => ({ ...prev, imageUrl: '' }))} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-[#ff6b6b] hover:bg-black/95 transition border border-white/5">*/}
                  {/*                  <X size={15} />*/}
                  {/*                </button>*/}
                  {/*              </div>*/}
                  {/*            )}*/}
                  {/*            {predefErrors.imageUrl && <span className="input-error block mt-2">{predefErrors.imageUrl}</span>}*/}
                  {/*          </div>*/}

                  {/*          <div className="flex justify-end pt-4">*/}
                  {/*            <button type="submit" disabled={predefSubmitting} className="btn btn-primary cursor-pointer w-full md:w-auto">*/}
                  {/*              {predefSubmitting ? (*/}
                  {/*                <>*/}
                  {/*                  <span className="spinner" />*/}
                  {/*                  <span>Publishing...</span>*/}
                  {/*                </>*/}
                  {/*              ) : (*/}
                  {/*                <>*/}
                  {/*                  <Sparkles size={16} />*/}
                  {/*                  <span>Publish Predefined Trip</span>*/}
                  {/*                </>*/}
                  {/*              )}*/}
                  {/*            </button>*/}
                  {/*          </div>*/}
                  {/*        </form>*/}
                  {/*      </div>*/}

                  {/*      <div className="space-y-6">*/}
                  {/*        <div className="glass-card p-6">*/}
                  {/*          <h4 className="font-semibold text-sm mb-2">Quick Tips</h4>*/}
                  {/*          <ul className="text-sm text-[var(--text-muted)] list-disc pl-5 space-y-1">*/}
                  {/*            <li>Ensure destinations already exist (use Destinations admin or API).</li>*/}
                  {/*            <li>Use high-quality images under 2MB for best presentation.</li>*/}
                  {/*            <li>Categories and transport modes must match enum values.</li>*/}
                  {/*          </ul>*/}
                  {/*        </div>*/}
                  {/*      </div>*/}
                  {/*    </div>*/}
                  {/*  </motion.div>*/}
                  {/* )}*/}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff6b6b] hover:bg-[#ff6b6b]/10 border border-transparent transition-all duration-200 cursor-pointer mt-auto"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </aside>

      {/* --- Mobile Sidebar / Header --- */}
      <div className="md:hidden fixed top-[80px] left-0 right-0 h-14 bg-[#111118]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-25">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#43e97b] animate-pulse" />
          <span className="text-xs font-semibold text-[#43e97b] uppercase tracking-wider">Live Control Panel</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 text-[#9898b3] hover:text-[#f0f0f8] rounded-lg bg-white/5 cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 top-[80px] z-30 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Sidebar content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[280px] h-full bg-[#0d0d14] border-r border-white/5 p-6 flex flex-col z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-bold tracking-wider uppercase text-[#6c63ff]">Sidebar Navigation</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 text-[#9898b3] hover:text-[#f0f0f8] bg-white/5 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Links */}
              <nav className="flex-1 space-y-1.5">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#6c63ff]/15 border border-[#6c63ff]/30 text-[#6c63ff]'
                          : 'text-[#9898b3] hover:text-[#f0f0f8] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-[#6c63ff]' : 'text-[#9898b3]'} />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#6c63ff]/20 text-[#6c63ff]' : 'bg-white/5 text-[#9898b3]'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff6b6b] hover:bg-[#ff6b6b]/10 border border-transparent transition-all duration-200 cursor-pointer mt-auto"
              >
                <LogOut size={18} />
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-20 md:py-8 z-5 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#43e97b] shadow-[0_0_10px_#43e97b]" />
                  <span className="text-xs font-bold text-[#43e97b] uppercase tracking-wider">Live Platform Status</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Dashboard <span className="gradient-text">Overview</span>
                </h1>
                <p className="text-sm text-[#9898b3]">Real-time analytics and server metrics</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {STAT_CARDS.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="stat-card"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                          <Icon size={20} color={card.color} />
                        </div>
                        {card.change && (
                          <span className="text-[10px] text-[#43e97b] font-bold bg-[#43e97b]/10 px-2 py-0.5 rounded-full">
                            {card.change}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-extrabold text-[#f0f0f8] mb-1 font-display tracking-tight">
                        {card.value}
                      </div>
                      <div className="text-xs text-[#9898b3] font-semibold">{card.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Charts */}
              {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Revenue Bar */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-[#f0f0f8] mb-6 flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#6c63ff]" />
                      Platform Monthly Revenue
                    </h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyRevenue?.slice().reverse() || []}>
                          <XAxis dataKey="month" tick={{ fill: '#9898b3', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#9898b3', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatINRShort(v).replace('₹','')}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#f0f0f8', fontFamily: 'Cabinet Grotesk' }}
                            formatter={v => [formatINR(v), 'Revenue']}
                          />
                          <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={45}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6c63ff" />
                                <stop offset="100%" stopColor="#ff6584" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bookings category Pie */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-[#f0f0f8] mb-6 flex items-center gap-2">
                      <Compass size={18} className="text-[#ff6584]" />
                      Bookings by Travel Category
                    </h3>
                    <div className="h-[280px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.bookingsByCategory || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            dataKey="count"
                            nameKey="category"
                            paddingAngle={4}
                          >
                            {(stats?.bookingsByCategory || []).map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#f0f0f8' }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(v) => <span className="text-xs text-[#9898b3] font-semibold uppercase">{v}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Packages in Dashboard */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#f0f0f8] flex items-center gap-2">
                    <Sparkles size={18} className="text-[#f9c74f]" />
                    🔥 Trending Trip Packages
                  </h3>
                  <button onClick={() => handleTabChange('manage-packages')} className="text-xs text-[#6c63ff] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    View All Packages <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-3.5">
                  {packages
                    .slice()
                    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
                    .slice(0, 5)
                    .map((pkg, i) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:border-[#6c63ff]/20 hover:bg-[#6c63ff]/2 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                          style={{
                            backgroundColor: `${COLORS[i % COLORS.length]}15`,
                            color: COLORS[i % COLORS.length]
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#f0f0f8]">{pkg.title || 'Untitled Package'}</h4>
                          <span className="text-[11px] text-[#9898b3] font-semibold">{pkg.destination || 'Destination not set'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm text-[#43e97b] font-display">{formatINR(toNumber(pkg.price))}</span>
                        <span className="text-[9px] text-[#9898b3] font-bold uppercase tracking-wider">Price / Person</span>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && (
                    <div className="text-center py-6 text-sm text-[#9898b3]">No packages found yet. Add one from the Add Package tab.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- Add Trip Package Tab --- */}
          {activeTab === 'add-package' && (
            <motion.div key="add-package" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <PlusCircle size={14} className="text-[#6c63ff]" />
                  <span className="text-xs font-bold text-[#6c63ff] uppercase tracking-wider">Package Publisher</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Add New <span className="gradient-text">Trip Package</span>
                </h1>
                <p className="text-sm text-[#9898b3]">Design and deploy an interactive travel offering</p>
              </div>

              {/* Form Layout Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Form fields (Left 2 columns) */}
                <div className="xl:col-span-2 glass-card p-6 md:p-8">
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Row 1: Package Title & Destination */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="input-group">
                        <label className="input-label">Package Title</label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Magical Maldives Escape"
                          className={`input-field ${formErrors.title ? 'error' : ''}`}
                        />
                        {formErrors.title && <span className="input-error">{formErrors.title}</span>}
                      </div>

                      <div className="input-group">
                        <label className="input-label">Destination</label>
                        <input
                          type="text"
                          name="destination"
                          value={form.destination}
                          onChange={handleInputChange}
                          placeholder="e.g., Male, Maldives"
                          className={`input-field ${formErrors.destination ? 'error' : ''}`}
                        />
                        {formErrors.destination && <span className="input-error">{formErrors.destination}</span>}
                      </div>
                    </div>

                    {/* Row 2: Price, Duration, Seats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="input-group">
                        <label className="input-label">Price per Person (₹)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-[50%] translate-y-[-50%] text-sm font-bold text-[#9898b3]">₹</span>
                          <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleInputChange}
                            placeholder="Price"
                            className={`input-field pl-8 ${formErrors.price ? 'error' : ''}`}
                          />
                        </div>
                        {formErrors.price && <span className="input-error">{formErrors.price}</span>}
                      </div>

                      <div className="input-group">
                        <label className="input-label">Duration</label>
                        <input
                          type="text"
                          name="duration"
                          value={form.duration}
                          onChange={handleInputChange}
                          placeholder="e.g., 5 Days / 4 Nights"
                          className={`input-field ${formErrors.duration ? 'error' : ''}`}
                        />
                        {formErrors.duration && <span className="input-error">{formErrors.duration}</span>}
                      </div>

                      <div className="input-group">
                        <label className="input-label">Available Seats</label>
                        <input
                          type="number"
                          name="availableSeats"
                          value={form.availableSeats}
                          onChange={handleInputChange}
                          placeholder="Total Seats"
                          className={`input-field ${formErrors.availableSeats ? 'error' : ''}`}
                        />
                        {formErrors.availableSeats && <span className="input-error">{formErrors.availableSeats}</span>}
                      </div>
                    </div>

                    {/* Row 3: Start Date & End Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={form.startDate}
                          onChange={handleInputChange}
                          className={`input-field ${formErrors.startDate ? 'error' : ''}`}
                        />
                        {formErrors.startDate && <span className="input-error">{formErrors.startDate}</span>}
                      </div>

                      <div className="input-group">
                        <label className="input-label">End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={form.endDate}
                          onChange={handleInputChange}
                          className={`input-field ${formErrors.endDate ? 'error' : ''}`}
                        />
                        {formErrors.endDate && <span className="input-error">{formErrors.endDate}</span>}
                      </div>
                    </div>

                    {/* Row 4: Description */}
                    <div className="input-group">
                      <label className="input-label">Package Description</label>
                      <textarea
                        name="description"
                        rows={4}
                        value={form.description}
                        onChange={handleInputChange}
                        placeholder="Tell travelers about key highlights, inclusions, and experiences of this package..."
                        className="input-field resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="btn btn-primary cursor-pointer w-full md:w-auto"
                      >
                        {formSubmitting ? (
                          <>
                            <span className="spinner" />
                            <span>Publishing Package...</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle size={16} />
                            <span>Publish Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Preview Panel (Right column) */}
                <div className="space-y-6">
                  {/* File Upload Box */}
                  <div className="glass-card p-6">
                    <label className="input-label mb-3 block">Package Image</label>
                    
                    {!form.imageUrl ? (
                      <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                        formErrors.imageUrl ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-white/10 hover:border-[#6c63ff]/40 hover:bg-[#6c63ff]/2'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload size={28} className="text-[#9898b3] mb-3" />
                        <h4 className="font-semibold text-sm mb-1">Click or drag image to upload</h4>
                        <p className="text-[10px] text-[#9898b3]">PNG, JPG or JPEG up to 2MB</p>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video">
                        <img src={form.imageUrl} alt="Upload Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-[#ff6b6b] hover:bg-black/95 transition border border-white/5 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                    {formErrors.imageUrl && <span className="input-error block mt-2 text-center">{formErrors.imageUrl}</span>}
                  </div>

                  {/* Airbnb-style Live WYSIWYG Preview Card */}
                  <div className="glass-card overflow-hidden transition-all duration-300">
                    <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#f9c74f] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={11} /> Live Card Preview
                      </span>
                      <span className="text-[9px] text-[#9898b3]">WYSIWYG</span>
                    </div>
                    {/* Card Media */}
                    <div className="relative aspect-[16/10] bg-white/3">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt={form.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#9898b3]">
                          <Compass size={32} className="animate-spin-slow mb-2" />
                          <span className="text-xs">Awaiting package image...</span>
                        </div>
                      )}
                      
                      {/* Price Tag Overlay */}
                      <div className="absolute top-4 right-4 bg-[#0a0a0f]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-xs font-extrabold text-[#43e97b] font-display">
                          {form.price ? formatINR(parseFloat(form.price)) : '₹0'}
                        </span>
                      </div>

                      {/* Seats overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Users2 size={10} /> {form.availableSeats || 0} Seats Remaining
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="badge badge-purple text-[9px]">EXPLORE</span>
                        {form.duration && (
                          <span className="badge badge-cyan text-[9px] flex items-center gap-1">
                            <Clock size={10} /> {form.duration}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-[#f0f0f8] mb-1.5 leading-tight line-clamp-1">
                        {form.title || 'Untitled Travel Package'}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-[#9898b3] mb-4">
                        <MapPin size={12} className="text-[#ff6584]" />
                        <span className="line-clamp-1">{form.destination || 'Awaiting destination...'}</span>
                      </div>

                      {form.startDate && form.endDate && (
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-[#9898b3] font-bold uppercase">
                          <span>Start: {safeFormatDate(form.startDate)}</span>
                          <span>End: {safeFormatDate(form.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

           {/* --- Add Predefined Trip Tab --- */}
           {activeTab === 'add-predefined' && (
             <motion.div key="add-predefined" {...pageTransition}>
               {/* Header */}
               <div className="mb-8">
                 <div className="flex items-center gap-2 mb-2">
                   <Sparkles size={14} className="text-[#6c63ff]" />
                   <span className="text-xs font-bold text-[#6c63ff] uppercase tracking-wider">Predefined Trips</span>
                 </div>
                 <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                   Add New <span className="gradient-text">Predefined Trip</span>
                 </h1>
                 <p className="text-sm text-[#9898b3]">Create a curated trip offering for users to browse and book</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                 <div className="lg:col-span-3 glass-card p-8 md:p-10">
                   <form onSubmit={handlePredefSubmit} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="input-group">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Trip Title *</label>
                         <input
                           type="text"
                           name="title"
                           value={predefForm.title}
                           onChange={(e) => setPredefForm(prev => ({ ...prev, title: e.target.value }))}
                           placeholder="e.g., Magical Kerala Backwaters"
                           className={`bg-[#16161f] border border-white/10 text-[#f0f0f8] placeholder-[#9898b3] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full ${predefErrors.title ? 'error border-[#ff6b6b]' : ''}`}
                         />
                         {predefErrors.title && <span className="input-error text-xs text-[#ff6b6b] mt-2 block">{predefErrors.title}</span>}
                       </div>

                       <div className="input-group">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Category *</label>
                         <select
                           name="category"
                           value={predefForm.category}
                           onChange={(e) => setPredefForm(prev => ({ ...prev, category: e.target.value }))}
                           className={`bg-[#16161f] border border-white/10 text-[#f0f0f8] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full cursor-pointer ${predefErrors.category ? 'error border-[#ff6b6b]' : ''}`}>
                           <option value="">Select category</option>
                           <option value="ADVENTURE">🏔️ ADVENTURE</option>
                           <option value="RELAXATION">🏝️ RELAXATION</option>
                           <option value="LUXURY">👑 LUXURY</option>
                           <option value="BUDGET">💰 BUDGET</option>
                           <option value="TREKKING">🥾 TREKKING</option>
                           <option value="FAMILY">👨‍👩‍👧‍👦 FAMILY</option>
                           <option value="BACKPACKING">🎒 BACKPACKING</option>
                         </select>
                         {predefErrors.category && <span className="input-error text-xs text-[#ff6b6b] mt-2 block">{predefErrors.category}</span>}
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="input-group">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Price per Person (₹) *</label>
                         <input
                           type="number"
                           name="pricePerPerson"
                           value={predefForm.pricePerPerson}
                           onChange={(e) => setPredefForm(prev => ({ ...prev, pricePerPerson: e.target.value }))}
                           placeholder="e.g., 25000"
                           className={`bg-[#16161f] border border-white/10 text-[#f0f0f8] placeholder-[#9898b3] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full ${predefErrors.pricePerPerson ? 'error border-[#ff6b6b]' : ''}`}
                         />
                         {predefErrors.pricePerPerson && <span className="input-error text-xs text-[#ff6b6b] mt-2 block">{predefErrors.pricePerPerson}</span>}
                       </div>

                       <div className="input-group">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Duration (days)</label>
                         <input
                           type="number"
                           name="durationDays"
                           value={predefForm.durationDays}
                           onChange={(e) => setPredefForm(prev => ({ ...prev, durationDays: e.target.value }))}
                           placeholder="e.g., 5"
                           className="bg-[#16161f] border border-white/10 text-[#f0f0f8] placeholder-[#9898b3] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full"
                         />
                       </div>

                       <div className="input-group">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Transport Mode</label>
                         <select
                           name="transportMode"
                           value={predefForm.transportMode}
                           onChange={(e) => setPredefForm(prev => ({ ...prev, transportMode: e.target.value }))}
                           className="bg-[#16161f] border border-white/10 text-[#f0f0f8] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full cursor-pointer">
                           <option value="">Select transport</option>
                           <option value="FLIGHT">✈️ FLIGHT</option>
                           <option value="TRAIN">🚂 TRAIN</option>
                           <option value="BUS">🚌 BUS</option>
                           <option value="CAR">🚗 CAR</option>
                           <option value="MIXED">🔀 MIXED</option>
                         </select>
                       </div>
                     </div>

                     <div className="input-group">
                       <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Trip Description</label>
                       <textarea
                         name="description"
                         rows={4}
                         value={predefForm.description}
                         onChange={(e) => setPredefForm(prev => ({ ...prev, description: e.target.value }))}
                         placeholder="Describe the highlights, inclusions, and experiences of this trip..."
                         className="bg-[#16161f] border border-white/10 text-[#f0f0f8] placeholder-[#9898b3] rounded-xl px-4 py-3 focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all w-full resize-none"
                       />
                     </div>

                     <div className="input-group pt-2">
                       <div className="flex items-center justify-between mb-4">
                         <label className="input-label text-sm font-semibold text-[#f0f0f8]">Select Destinations *</label>
                         <button type="button" onClick={() => setIsDestModalOpen(true)} className="text-xs text-[#6c63ff] hover:text-[#a78bfa] font-semibold flex items-center gap-2 transition-colors">
                           <PlusCircle size={16} />
                           <span>Add Destination</span>
                         </button>
                       </div>
                       <div className="react-select-wrapper">
                         <Select
                           isMulti
                           options={availableDestinations.map(d => ({ value: d.id, label: `${d.name}${d.state ? ' · ' + d.state : ''}` }))}
                           value={availableDestinations
                             .map(d => ({ value: d.id, label: `${d.name}${d.state ? ' · ' + d.state : ''}` }))
                             .filter(opt => selectedDestinationIds.includes(opt.value))}
                           onChange={(selected) => setSelectedDestinationIds(Array.isArray(selected) ? selected.map(s => s.value) : [])}
                           placeholder={availableDestinations.length ? 'Search and select destinations...' : 'No destinations available'}
                           classNamePrefix="react-select"
                           menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                           menuPosition="fixed"
                           isClearable
                           isSearchable
                           styles={{
                             control: (base, state) => ({
                               ...base,
                               backgroundColor: '#16161f',
                               borderColor: state.isFocused ? '#6c63ff' : '#ffffff1a',
                               borderWidth: '1px',
                               borderRadius: '12px',
                               minHeight: '44px',
                               boxShadow: state.isFocused ? '0 0 0 1px #6c63ff' : 'none',
                               transition: 'all 0.2s',
                               cursor: 'pointer',
                               '&:hover': { borderColor: '#6c63ff' }
                             }),
                             option: (base, state) => ({
                               ...base,
                               backgroundColor: state.isSelected ? '#6c63ff' : state.isFocused ? '#6c63ff20' : '#111118',
                               color: state.isSelected ? '#ffffff' : '#f0f0f8',
                               padding: '12px 16px',
                               cursor: 'pointer',
                               fontSize: '14px',
                               fontWeight: '500',
                               '&:active': { backgroundColor: '#6c63ff' }
                             }),
                             multiValue: (base) => ({ ...base, backgroundColor: '#6c63ff20', borderRadius: '8px', padding: '4px 8px', margin: '4px' }),
                             multiValueLabel: (base) => ({ ...base, color: '#6c63ff', fontWeight: '600', fontSize: '13px' }),
                             multiValueRemove: (base) => ({ ...base, color: '#6c63ff', cursor: 'pointer', '&:hover': { backgroundColor: '#6c63ff', color: '#ffffff' } }),
                             input: (base) => ({ ...base, color: '#f0f0f8' }),
                             placeholder: (base) => ({ ...base, color: '#9898b3' }),
                             menu: (base) => ({ ...base, backgroundColor: '#111118', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)', zIndex: 9999 }),
                             menuList: (base) => ({ ...base, padding: '8px 0', maxHeight: '280px' })
                           }}
                         />
                         {predefErrors.destinationIds && <div className="input-error text-xs text-[#ff6b6b] mt-2 block">{predefErrors.destinationIds}</div>}
                       </div>
                     </div>

                     {/* Image upload */}
                     <div className="input-group">
                       <label className="input-label text-sm font-semibold text-[#f0f0f8] mb-3 block">Feature Image</label>
                       {!predefForm.imageUrl ? (
                         <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${predefErrors.imageUrl ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-white/10 hover:border-[#6c63ff]/40 hover:bg-[#6c63ff]/2'}`}>
                           <input type="file" accept="image/*" onChange={handlePredefImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                           <Upload size={32} className="text-[#9898b3] mb-4" />
                           <h4 className="font-semibold text-sm mb-1">Click or drag image to upload</h4>
                           <p className="text-[11px] text-[#9898b3]">PNG, JPG or JPEG up to 2MB</p>
                         </div>
                       ) : (
                         <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video group">
                           <img src={predefForm.imageUrl} alt={predefForm.title} className="w-full h-full object-cover group-hover:opacity-80 transition" />
                           <button onClick={() => setPredefForm(prev => ({ ...prev, imageUrl: '' }))} className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 text-[#ff6b6b] hover:bg-black/95 transition border border-white/5">
                             <X size={18} />
                           </button>
                         </div>
                       )}
                       {predefErrors.imageUrl && <span className="input-error text-xs text-[#ff6b6b] mt-2 block">{predefErrors.imageUrl}</span>}
                     </div>

                     <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                       <button type="button" onClick={() => { setPredefForm({ title: '', description: '', category: '', pricePerPerson: '', durationDays: '', bestSeason: '', transportMode: '', imageUrl: '' }); setSelectedDestinationIds([]); }} className="btn btn-secondary cursor-pointer">
                         Cancel
                       </button>
                       <button type="submit" disabled={predefSubmitting} className="btn btn-primary cursor-pointer w-full md:w-auto">
                         {predefSubmitting ? (
                           <>
                             <span className="spinner" />
                             <span>Publishing...</span>
                           </>
                         ) : (
                           <>
                             <Sparkles size={16} />
                             <span>Publish Trip</span>
                           </>
                         )}
                       </button>
                     </div>
                   </form>
                 </div>

                 <div className="space-y-6">
                   <div className="glass-card p-6 sticky top-0">
                     <div className="flex items-center gap-2 mb-4">
                       <Info size={16} className="text-[#6c63ff]" />
                       <h4 className="font-semibold text-sm text-[#f0f0f8]">Quick Tips</h4>
                     </div>
                     <ul className="text-sm text-[#9898b3] space-y-3">
                       <li className="flex gap-3">
                         <span className="text-[#6c63ff] font-bold mt-1">•</span>
                         <span>Ensure destinations already exist before creating the trip.</span>
                       </li>
                       <li className="flex gap-3">
                         <span className="text-[#6c63ff] font-bold mt-1">•</span>
                         <span>Use high-quality images under 2MB for best presentation.</span>
                       </li>
                       <li className="flex gap-3">
                         <span className="text-[#6c63ff] font-bold mt-1">•</span>
                         <span>Categories and transport modes must match available options.</span>
                       </li>
                       <li className="flex gap-3">
                         <span className="text-[#6c63ff] font-bold mt-1">•</span>
                         <span>You can add new destinations inline using the "Add Destination" button.</span>
                       </li>
                     </ul>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}

           {/* --- Manage Packages Tab --- */}
           {activeTab === 'manage-packages' && (
            <motion.div key="manage-packages" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Compass size={14} className="text-[#43e97b]" />
                  <span className="text-xs font-bold text-[#43e97b] uppercase tracking-wider">Catalog Operations</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Manage <span className="gradient-text">Trip Packages</span>
                </h1>
                <p className="text-sm text-[#9898b3]">Browse, examine, and delete travel catalogs</p>
              </div>

              {/* Package Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="glass-card overflow-hidden flex flex-col group">
                    <div className="relative aspect-[16/10] bg-white/2 overflow-hidden">
                      {pkg.imageUrl ? (
                        <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-[#16161f] flex items-center justify-center text-[#9898b3]">No Image</div>
                      )}
                      
                      {/* Price badges */}
                      <div className="absolute top-4 right-4 bg-[#0a0a0f]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-xs font-extrabold text-[#43e97b] font-display">{formatINR(pkg.price)}</span>
                      </div>

                      {/* Seats */}
                      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Users2 size={10} /> {pkg.availableSeats} Seats left
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="badge badge-purple text-[9px]">TRAVEL DEAL</span>
                        <span className="badge badge-cyan text-[9px] flex items-center gap-1">
                          <Clock size={10} /> {pkg.duration}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#f0f0f8] mb-1.5 leading-tight line-clamp-1">{pkg.title}</h3>

                      <div className="flex items-center gap-1.5 text-xs text-[#9898b3] mb-4">
                        <MapPin size={12} className="text-[#ff6584]" />
                        <span>{pkg.destination}</span>
                      </div>

                      {pkg.description && (
                        <p className="text-xs text-[#9898b3] line-clamp-3 mb-5 leading-relaxed">{pkg.description}</p>
                      )}

                      {/* Timeline / Dates */}
                      <div className="mt-auto pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] text-[#9898b3] font-bold uppercase mb-4">
                          <span className="flex items-center gap-1"><CalendarDays size={11} /> {safeFormatDate(pkg.startDate)}</span>
                          <span>{safeFormatDate(pkg.endDate)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="btn btn-sm btn-danger cursor-pointer !rounded-lg flex items-center gap-1.5 w-full md:w-auto justify-center"
                          >
                            <Trash2 size={13} />
                            <span>Delete Package</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {packages.length === 0 && (
                  <div className="col-span-full glass-card p-12 text-center">
                    <Compass size={40} className="mx-auto text-[#9898b3] mb-3 animate-spin-slow" />
                    <h3 className="font-bold mb-1">Catalog Empty</h3>
                    <p className="text-sm text-[#9898b3] max-w-xs mx-auto mb-6">Create a trip package from the 'Add Package' tab to get started.</p>
                    <button onClick={() => handleTabChange('add-package')} className="btn btn-sm btn-primary">
                      Create Package
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- Bookings Tab --- */}
          {activeTab === 'bookings' && (
            <motion.div key="bookings" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={14} className="text-[#f9c74f]" />
                  <span className="text-xs font-bold text-[#f9c74f] uppercase tracking-wider">Client Registrations</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Platform <span className="gradient-text">Bookings</span>
                </h1>
                <p className="text-sm text-[#9898b3]">Browse and manage global booking reservations</p>
              </div>

              {/* Bookings Table */}
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-bold">Booking Logs ({bookings.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/2 border-b border-white/5">
                        {['ID', 'Trip Package', 'User Profile', 'Travel Date', 'Total Amount', 'Status'].map(th => (
                          <th key={th} className="px-5 py-3 text-left text-xs font-bold text-[#9898b3] uppercase tracking-wider whitespace-nowrap">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.bookingId} className="border-b border-white/5 hover:bg-white/1 transition duration-150">
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-bold font-mono text-[#ff6584]">
                            #{booking.bookingId}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-[#f0f0f8]">
                            {booking.tripTitle}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#f0f0f8]">{booking.userName}</div>
                            <span className="text-[10px] text-[#9898b3] font-bold">{booking.participantCount} Travelers</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-[#9898b3]">
                            {safeFormatDate(booking.travelDate)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#43e97b] font-display">
                            {formatINR(booking.totalAmount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`badge ${
                              booking.bookingStatus === 'CONFIRMED' ? 'badge-green' :
                              booking.bookingStatus === 'PENDING' ? 'badge-amber' :
                              booking.bookingStatus === 'REFUNDED' ? 'badge-cyan' : 'badge-coral'
                            }`}>
                              {booking.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#9898b3]">
                            No platform bookings recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- Users Tab --- */}
          {activeTab === 'users' && (
            <motion.div key="users" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-[#a78bfa]" />
                  <span className="text-xs font-bold text-[#a78bfa] uppercase tracking-wider">Access Controls</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Platform <span className="gradient-text">Users</span>
                </h1>
                <p className="text-sm text-[#9898b3]">Manage system users and access privileges</p>
              </div>

              {/* Users Table */}
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-sm font-bold">Registered Profiles ({usersList.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/2 border-b border-white/5">
                        {['User Profile', 'Email Address', 'Authorization Role', 'Bookings', 'Total Spend', 'Member Since'].map(th => (
                          <th key={th} className="px-5 py-3 text-left text-xs font-bold text-[#9898b3] uppercase tracking-wider whitespace-nowrap">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((userItem, index) => (
                        <tr key={userItem?.id ?? `user-${index}`} className="border-b border-white/5 hover:bg-white/1 transition duration-150">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6c63ff] to-[#00d2ff] flex items-center justify-center font-bold text-white text-xs">
                                {userItem?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <span className="text-sm font-semibold text-[#f0f0f8]">{userItem?.name || 'Unknown User'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-[#9898b3] font-semibold">
                            {userItem?.email || '-'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`badge ${userItem?.role === 'ADMIN' || userItem?.role === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-purple'}`}>
                              {userItem?.role || 'USER'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#f0f0f8]">
                            {toNumber(userItem?.totalBookings)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#43e97b] font-display">
                            {formatINR(toNumber(userItem?.totalSpend))}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-[#9898b3]">
                            {pkgDate(userItem?.joinedAt)}
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#9898b3]">
                            No users available to display.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- Analytics Tab --- */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" {...pageTransition}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-[#ff6584]" />
                  <span className="text-xs font-bold text-[#ff6584] uppercase tracking-wider">Metrics visualization</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  Advanced <span className="gradient-text">Analytics</span>
                </h1>
                <p className="text-sm text-[#9898b3]">In-depth performance metrics and analytics curves</p>
              </div>

              {stats && (
                <div className="space-y-6">
                  {/* Revenue Growth Trend Area Chart */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-[#f0f0f8] mb-6">📈 Revenue Growth Trend</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyRevenue?.slice().reverse() || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: '#9898b3', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#9898b3', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatINRShort(v).replace('₹','')}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#f0f0f8' }}
                            formatter={v => [formatINR(v), 'Monthly Revenue']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#6c63ff" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Growth Metrics Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="glass-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#43e97b]/10 flex items-center justify-center text-[#43e97b]">
                        <Activity size={24} />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold font-display">{stats.totalExpensesRecorded}</span>
                        <span className="text-[11px] text-[#9898b3] font-semibold uppercase">Expenses Recorded</span>
                      </div>
                    </div>
                    {/* Card 2 */}
                    <div className="glass-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#f9c74f]/10 flex items-center justify-center text-[#f9c74f]">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold font-display">{stats.confirmedBookings}</span>
                        <span className="text-[11px] text-[#9898b3] font-semibold uppercase">Confirmed Sales Bookings</span>
                      </div>
                    </div>
                    {/* Card 3 */}
                    <div className="glass-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#ff6b6b]/10 flex items-center justify-center text-[#ff6b6b]">
                        <XCircle size={24} />
                      </div>
                      <div>
                        <span className="block text-2xl font-extrabold font-display">{stats.cancelledBookings}</span>
                        <span className="text-[11px] text-[#9898b3] font-semibold uppercase">Cancelled Sales Bookings</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Styled JSX */}
      {/* Destination creation modal (inline) */}
      <AnimatePresence>
        {isDestModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDestModalOpen(false)} />
            <motion.div initial={{ scale: 0.98, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="relative w-full max-w-2xl bg-[#0b0b10] border border-white/5 rounded-2xl p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Create Destination</h3>
                <button onClick={() => setIsDestModalOpen(false)} className="text-[#9898b3] hover:text-[#f0f0f8] p-1 rounded">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDestination} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Name</label>
                    <input value={destForm.name} onChange={(e) => setDestForm(prev => ({ ...prev, name: e.target.value }))} className={`input-field ${destErrors.name ? 'error' : ''}`} />
                    {destErrors.name && <div className="input-error">{destErrors.name}</div>}
                  </div>

                  <div>
                    <label className="input-label">Category</label>
                    <select value={destForm.category} onChange={(e) => setDestForm(prev => ({ ...prev, category: e.target.value }))} className={`input-field ${destErrors.category ? 'error' : ''}`}>
                      <option value="">Select category</option>
                      <option value="ADVENTURE">ADVENTURE</option>
                      <option value="RELAXATION">RELAXATION</option>
                      <option value="LUXURY">LUXURY</option>
                      <option value="BUDGET">BUDGET</option>
                      <option value="TREKKING">TREKKING</option>
                      <option value="FAMILY">FAMILY</option>
                      <option value="BACKPACKING">BACKPACKING</option>
                    </select>
                    {destErrors.category && <div className="input-error">{destErrors.category}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Avg. Cost / Person (₹)</label>
                    <input value={destForm.avgCostPerPerson} onChange={(e) => setDestForm(prev => ({ ...prev, avgCostPerPerson: e.target.value }))} type="number" min="0" step="0.01" className={`input-field ${destErrors.avgCostPerPerson ? 'error' : ''}`} />
                    {destErrors.avgCostPerPerson && <div className="input-error">{destErrors.avgCostPerPerson}</div>}
                  </div>

                  <div>
                    <label className="input-label">State</label>
                    <input value={destForm.state} onChange={(e) => setDestForm(prev => ({ ...prev, state: e.target.value }))} className="input-field" />
                  </div>

                  <div>
                    <label className="input-label">Country</label>
                    <input value={destForm.country} onChange={(e) => setDestForm(prev => ({ ...prev, country: e.target.value }))} className="input-field" />
                  </div>
                </div>

                <div>
                  <label className="input-label">Short description</label>
                  <textarea value={destForm.description} onChange={(e) => setDestForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="input-field resize-none" />
                </div>
                <div>
                  <label className="input-label">Destination Images</label>

                  <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleDestinationImages}
                      className="input-field cursor-pointer"
                  />

                  {destForm.imageUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">

                        {destForm.imageUrls.map((img, index) => (

                            <div
                                key={index}
                                className="relative rounded-xl overflow-hidden border border-white/10"
                            >
                              <img
                                  src={img}
                                  alt={`preview-${index}`}
                                  className="w-full h-24 object-cover"
                              />

                              <button
                                  type="button"
                                  onClick={() =>
                                      setDestForm(prev => ({
                                        ...prev,
                                        imageUrls: prev.imageUrls.filter((_, i) => i !== index)
                                      }))
                                  }
                                  className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-red-400 hover:text-red-300"
                              >
                                <X size={12} />
                              </button>

                            </div>

                        ))}

                      </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsDestModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={destSubmitting} className="btn btn-primary">
                    {destSubmitting ? <span className="spinner" /> : <PlusCircle size={14} />}
                    <span>{destSubmitting ? 'Creating...' : 'Create Destination'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        /* React-Select portal width fix and z-index safety */
        .react-select-container { width: 100%; }
        /* ensure react-select menu portal is above other overlays */
        .react-select__menu-list { z-index: 9999; }
      `}</style>
    </div>
  );
}

// Simple Date formatting fallback for user joined formats
function pkgDate(joined) {
  if (!joined) return '—';
  try {
    return new Date(joined).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (err) {
    return joined;
  }
}

// Inner Page Loader Component
function PageLoader() {
  return (
    <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center bg-[#0a0a0f] text-[#f0f0f8]">
      <div className="spinner border-t-[#6c63ff] border-r-transparent border-white/10 w-12 h-12 border-4 mb-4" />
      <span className="text-xs text-[#9898b3] font-semibold tracking-widest uppercase animate-pulse">Syncing metrics with server...</span>
    </div>
  );
}
