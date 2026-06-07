import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, Shield, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import useAuthStore from '../store/authStore';
import { initials, PASSWORD_PATTERN } from '../utils/helpers';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving]       = useState(false);

  const profileForm = useForm({ defaultValues: { name: user?.name || '' } });
  const passwordForm = useForm();

  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      const res = await authService.updateProfile(data);
      updateUser(res.data);
      toast.success('Profile updated ✅');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const onChangePassword = async (data) => {
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed 🔐');
      passwordForm.reset();
    } catch (err) {
      toast.error(err?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const TABS = [
    { id: 'profile',  label: 'Profile',  icon: User   },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom: 80 }}>

          {/* Header */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      style={{ paddingTop: 20, marginBottom: 40 }}>
            <h2>My <span className="gradient-text">Profile</span></h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr',
            gap: 32, alignItems: 'start' }}>

            {/* Sidebar */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay: 0.1 }}>

              {/* Avatar card */}
              <div className="glass-card" style={{ padding: 28, textAlign: 'center',
                marginBottom: 16 }}>
                <div style={{ position: 'relative', display: 'inline-block',
                  marginBottom: 16 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 700, color: '#fff',
                    boxShadow: '0 0 30px var(--accent-glow)',
                  }}>
                    {initials(user?.name)}
                  </div>
                  <button style={{
                    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
                    borderRadius: '50%', background: 'var(--accent-primary)',
                    border: '2px solid var(--bg-card)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}>
                    <Camera size={13} />
                  </button>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{user?.name}</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>{user?.email}</p>
                <span className="badge"
                      style={{ background: user?.role === 'ADMIN'
                            ? 'rgba(249,199,79,0.15)' : 'rgba(108,99,255,0.15)',
                        color: user?.role === 'ADMIN'
                            ? 'var(--accent-amber)' : 'var(--accent-primary)' }}>
                {user?.role}
              </span>
                {user?.provider && user.provider !== 'LOCAL' && (
                    <div style={{ marginTop: 8 }}>
                  <span className="badge badge-cyan">
                    via {user.provider}
                  </span>
                    </div>
                )}
              </div>

              {/* Nav */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '11px 14px', borderRadius: 'var(--radius-md)',
                              background: activeTab === id ? 'rgba(108,99,255,0.12)' : 'transparent',
                              border: `1px solid ${activeTab === id ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                              color: activeTab === id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              cursor: 'pointer', fontSize: '0.92rem', fontWeight: 500,
                              transition: 'all 0.15s',
                            }}>
                      <Icon size={16} /> {label}
                    </button>
                ))}
                <button onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '11px 14px', borderRadius: 'var(--radius-md)',
                          background: 'transparent', border: '1px solid transparent',
                          color: 'var(--accent-coral)', cursor: 'pointer',
                          fontSize: '0.92rem', fontWeight: 500, marginTop: 8,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>

            {/* Main content */}
            <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay: 0.15 }}>

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                  <div className="glass-card" style={{ padding: 32 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>
                      Personal Information
                    </h3>
                    <form onSubmit={profileForm.handleSubmit(onSaveProfile)}
                          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} style={{ position: 'absolute', left: 14,
                            top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', pointerEvents: 'none' }} />
                          <input className="input-field" style={{ paddingLeft: 40 }}
                                 placeholder="Your full name"
                                 {...profileForm.register('name', { required: 'Name is required' })} />
                        </div>
                        {profileForm.formState.errors.name && (
                            <span className="input-error">
                        {profileForm.formState.errors.name.message}
                      </span>
                        )}
                      </div>

                      <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} style={{ position: 'absolute', left: 14,
                            top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', pointerEvents: 'none' }} />
                          <input className="input-field" disabled
                                 value={user?.email || ''} style={{ paddingLeft: 40,
                            opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Email cannot be changed
                    </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="input-group">
                          <label className="input-label">Role</label>
                          <input className="input-field" disabled value={user?.role || ''}
                                 style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Auth Provider</label>
                          <input className="input-field" disabled
                                 value={user?.provider || 'LOCAL'}
                                 style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? <span className="spinner" /> : <><Save size={15} /> Save Changes</>}
                        </button>
                      </div>
                    </form>
                  </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                  <div className="glass-card" style={{ padding: 32 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>
                      Change Password
                    </h3>
                    <p style={{ fontSize: '0.88rem', marginBottom: 28 }}>
                      Use a strong password with uppercase, lowercase, numbers & symbols.
                    </p>

                    {user?.provider && user.provider !== 'LOCAL' ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔗</div>
                          <h3 style={{ marginBottom: 8 }}>OAuth2 Account</h3>
                          <p>Password management is handled by {user.provider}.</p>
                        </div>
                    ) : (
                        <form onSubmit={passwordForm.handleSubmit(onChangePassword)}
                              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                          {[
                            { name: 'currentPassword', label: 'Current Password',
                              placeholder: 'Enter current password', rules: { required: 'Required' } },
                            { name: 'newPassword', label: 'New Password',
                              placeholder: 'Min 8 chars', rules: {
                                required: 'Required',
                                pattern: { value: PASSWORD_PATTERN,
                                  message: 'Must contain uppercase, lowercase, number & special char' },
                              }},
                            { name: 'confirmPassword', label: 'Confirm New Password',
                              placeholder: 'Repeat new password', rules: {
                                required: 'Required',
                                validate: v => v === passwordForm.watch('newPassword')
                                    || 'Passwords do not match',
                              }},
                          ].map(({ name, label, placeholder, rules }) => (
                              <div key={name} className="input-group">
                                <label className="input-label">{label}</label>
                                <div style={{ position: 'relative' }}>
                                  <Lock size={16} style={{ position: 'absolute', left: 14,
                                    top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                  <input type="password" className={`input-field ${
                                      passwordForm.formState.errors[name] ? 'error' : ''}`}
                                         style={{ paddingLeft: 40 }} placeholder={placeholder}
                                         {...passwordForm.register(name, rules)} />
                                </div>
                                {passwordForm.formState.errors[name] && (
                                    <span className="input-error">
                            {passwordForm.formState.errors[name].message}
                          </span>
                                )}
                              </div>
                          ))}

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                              {saving ? <span className="spinner" />
                                  : <><Lock size={15} /> Update Password</>}
                            </button>
                          </div>
                        </form>
                    )}
                  </div>
              )}
            </motion.div>
          </div>
        </div>

        <style>{`
        @media (max-width: 768px) {
          .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      </div>
  );
}