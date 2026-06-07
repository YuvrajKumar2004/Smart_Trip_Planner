import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Menu, X, User, LogOut, LayoutDashboard,
  Compass, BookOpen, Wallet, ChevronDown, PlusCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Explore',   href: '/explore',   icon: Compass },
  { label: 'My Trips',  href: '/trips',      icon: Map },
  { label: 'Bookings',  href: '/bookings',   icon: BookOpen },
  { label: 'Expenses',  href: '/expenses',   icon: Wallet },
];

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
      <>
        <motion.nav
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
              background: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
              borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.3s ease',
            }}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="container" style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: 70 }}>

            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px var(--accent-glow)',
              }}>
                <Map size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              Trip<span className="gradient-text">Planner</span>
            </span>
            </Link>

            {/* Desktop links */}
            {isAuthenticated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                     className="desktop-nav">
                  {NAV_LINKS.map(({ label, href, icon: Icon }) => (
                      <Link key={href} to={href} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                        color: location.pathname.startsWith(href)
                            ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        background: location.pathname.startsWith(href)
                            ? 'rgba(108,99,255,0.1)' : 'transparent',
                      }}>
                        <Icon size={15} />
                        {label}
                      </Link>
                  ))}
                  {isAdmin() && (
                      <Link to="/admin/dashboard" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                        color: location.pathname.startsWith('/admin')
                            ? 'var(--accent-amber)' : 'var(--text-secondary)',
                        background: location.pathname.startsWith('/admin')
                            ? 'rgba(249,199,79,0.1)' : 'transparent',
                      }}>
                        <LayoutDashboard size={15} />
                        Admin
                      </Link>
                  )}
                  {isAdmin() && (
                      <Link to="/admin/packages/new" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                        color: location.pathname.startsWith('/admin/packages/new')
                            ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        background: location.pathname.startsWith('/admin/packages/new')
                            ? 'rgba(108,99,255,0.1)' : 'transparent',
                      }}>
                        <PlusCircle size={15} />
                        Add Package
                      </Link>
                  )}
                </div>
            )}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isAuthenticated ? (
                  <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-full)', padding: '6px 14px 6px 8px',
                          cursor: 'pointer', color: 'var(--text-primary)',
                          transition: 'all 0.2s',
                        }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                      }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)',
                        transform: profileOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s' }} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                          <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)', minWidth: 180,
                                overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
                              }}
                          >
                            <Link to="/profile" style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '12px 16px', color: 'var(--text-secondary)',
                              fontSize: '0.9rem', transition: 'all 0.15s',
                              borderBottom: '1px solid var(--divider)',
                            }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <User size={15} /> Profile
                            </Link>
                            <button onClick={handleLogout} style={{
                              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                              padding: '12px 16px', color: 'var(--accent-coral)',
                              fontSize: '0.9rem', background: 'transparent',
                              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <LogOut size={15} /> Logout
                            </button>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              ) : (
                  <>
                    <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                  </>
              )}

              {/* Mobile menu button */}
              <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="btn btn-ghost btn-icon mobile-menu-btn"
                  style={{ display: 'none' }}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    position: 'fixed', top: 70, left: 0, right: 0, zIndex: 999,
                    background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
              >
                <div className="container" style={{ padding: '16px 24px', display: 'flex',
                  flexDirection: 'column', gap: 4 }}>
                  {isAuthenticated && NAV_LINKS.map(({ label, href, icon: Icon }) => (
                      <Link key={href} to={href} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)', fontSize: '0.95rem',
                        background: location.pathname.startsWith(href)
                            ? 'rgba(108,99,255,0.1)' : 'transparent',
                      }}>
                        <Icon size={16} /> {label}
                      </Link>
                  ))}
                  {isAuthenticated && isAdmin() && (
                      <Link to="/admin/dashboard" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)', fontSize: '0.95rem',
                        background: location.pathname.startsWith('/admin')
                            ? 'rgba(249,199,79,0.1)' : 'transparent',
                      }}>
                        <LayoutDashboard size={16} /> Admin
                      </Link>
                  )}
                  {isAuthenticated && isAdmin() && (
                      <Link to="/admin/packages/new" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)', fontSize: '0.95rem',
                        background: location.pathname.startsWith('/admin/packages/new')
                            ? 'rgba(108,99,255,0.1)' : 'transparent',
                      }}>
                        <PlusCircle size={16} /> Add Package
                      </Link>
                  )}
                  {!isAuthenticated && (
                      <>
                        <Link to="/login" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                          Login
                        </Link>
                        <Link to="/register" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                          Get Started
                        </Link>
                      </>
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
      </>
  );
}
