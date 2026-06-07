import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Map } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const OAUTH_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');

// ── Shared Auth Layout ────────────────────────────────────────────────────────
function AuthLayout({ children, title, subtitle }) {
  return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '100px 24px 40px', position: 'relative',
      }}>
        <div className="orb orb-purple" style={{ width: 500, height: 500,
          top: -100, left: '50%', transform: 'translateX(-70%)' }} />
        <div className="orb orb-pink" style={{ width: 350, height: 350,
          bottom: -50, right: '5%' }} />
        <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.3 }} />

        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: '100%', maxWidth: 460, position: 'relative', zIndex: 1,
            }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center',
              gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px var(--accent-glow)',
              }}>
                <Map size={20} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem',
                fontWeight: 700 }}>
              Trip<span className="gradient-text">Planner</span>
            </span>
            </Link>
            <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: '0.95rem' }}>{subtitle}</p>
          </div>

          <div className="glass-card" style={{ padding: '36px 32px' }}>
            {children}
          </div>
        </motion.div>
      </div>
  );
}

// ── Input Field Component ─────────────────────────────────────────────────────
function FormInput({ label, icon: Icon, type = 'text', placeholder,
                     register, error, ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <div style={{ position: 'relative' }}>
          {Icon && (
              <Icon size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
          )}
          <input
              type={isPassword ? (show ? 'text' : 'password') : type}
              placeholder={placeholder}
              className={`input-field ${error ? 'error' : ''}`}
              style={{ paddingLeft: Icon ? 40 : 16, paddingRight: isPassword ? 40 : 16 }}
              {...register}
              {...rest}
          />
          {isPassword && (
              <button type="button" onClick={() => setShow(!show)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)',
              }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
          )}
        </div>
        {error && <span className="input-error">{error.message}</span>}
      </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Welcome back! 🎉');
      navigate('/explore');
    } catch (err) {
      toast.error(err?.message || 'Invalid credentials');
    }
  };

  return (
      <AuthLayout title="Welcome back" subtitle="Sign in to continue your journey">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex',
          flexDirection: 'column', gap: 20 }}>

          <FormInput label="Email address" icon={Mail} type="email"
                     placeholder="you@example.com"
                     register={register('email', {
                       required: 'Email is required',
                       pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                         message: 'Invalid email address' }
                     })}
                     error={errors.email}
          />

          <FormInput label="Password" icon={Lock} type="password"
                     placeholder="Enter your password"
                     register={register('password', { required: 'Password is required' })}
                     error={errors.password}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem',
              color: 'var(--accent-primary)' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : (
                <><span>Sign In</span><ArrowRight size={16} /></>
            )}
          </button>

          <div className="divider">or</div>

          {/* Google OAuth2 */}
          <a href={`${OAUTH_BASE_URL}/oauth2/authorization/google`}
             className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" width={16} height={16} />
            Continue with Google
          </a>

          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </form>
      </AuthLayout>
  );
}

// ── REGISTER PAGE ─────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    try {
      await registerUser(payload);
      toast.success('Account created! Welcome aboard 🚀');
      navigate('/explore');
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    }
  };

  return (
      <AuthLayout title="Create your account"
                  subtitle="Start planning amazing trips today — free forever">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex',
          flexDirection: 'column', gap: 18 }}>

          <FormInput label="Full name" icon={User} placeholder="John Doe"
                     register={register('name', {
                       required: 'Name is required',
                       minLength: { value: 2, message: 'Name must be at least 2 characters' }
                     })}
                     error={errors.name}
          />

          <FormInput label="Email address" icon={Mail} type="email"
                     placeholder="you@example.com"
                     register={register('email', {
                       required: 'Email is required',
                       pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                         message: 'Invalid email address' }
                     })}
                     error={errors.email}
          />

          <FormInput label="Password" icon={Lock} type="password"
                     placeholder="Min 8 chars, with uppercase & symbol"
                     register={register('password', {
                       required: 'Password is required',
                       pattern: {
                         value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
                         message: 'Must contain uppercase, lowercase, number & special char'
                       }
                     })}
                     error={errors.password}
          />

          <FormInput label="Confirm password" icon={Lock} type="password"
                     placeholder="Re-enter your password"
                     register={register('confirmPassword', {
                       required: 'Please confirm your password',
                       validate: (val) => val === password || 'Passwords do not match',
                     })}
                     error={errors.confirmPassword}
          />

          <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : (
                <><span>Create Account</span><ArrowRight size={16} /></>
            )}
          </button>

          <div className="divider">or</div>

          <a href={`${OAUTH_BASE_URL}/oauth2/authorization/google`}
             className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" width={16} height={16} />
            Sign up with Google
          </a>

          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.78rem',
            color: 'var(--text-muted)', marginTop: -4 }}>
            By registering you agree to our Terms of Service & Privacy Policy.
          </p>
        </form>
      </AuthLayout>
  );
}
