import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Users, Wallet, Star,
  MapPin, Zap, TrendingUp, Sparkles, Heart, Lock, Flame } from 'lucide-react';
import { predefinedTripService } from '../services';
import { getPrimaryImageUrl } from '../utils/helpers';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Smart Recommendations',
    color: '#6c63ff',
    desc: 'Discover personalized trips powered by advanced AI that understands your preferences perfectly.'
  },
  {
    icon: Users,
    title: 'Seamless Group Splitting',
    color: '#ff6584',
    desc: 'Effortlessly split expenses with automatic debt calculation and settlement.'
  },
  {
    icon: TrendingUp,
    title: 'Smart Budget Control',
    color: '#43e97b',
    desc: 'Real-time budget tracking with intelligent spending recommendations and alerts.'
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    color: '#f9c74f',
    desc: 'Your data and payments protected with enterprise-grade security and encryption.'
  },
];

const STATS = [
  { value: '50K+', label: 'Happy Travelers', icon: Heart },
  { value: '200+', label: 'Destinations', icon: MapPin },
  { value: '₹2Cr+', label: 'Tracked Expenses', icon: TrendingUp },
  { value: '4.9★', label: 'User Rating', icon: Star },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function HomePage() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    predefinedTripService.getAll({ page: 0, size: 6 })
        .then(res => setTrips(res.data?.data?.content || []))
        .catch(() => {});
  }, []);

  return (
      <div style={{ overflowX: 'hidden' }}>

        {/* ── EPIC HERO SECTION ─────────────────────────────────────────── */}
        <section style={{ 
            minHeight: '100vh', display: 'flex', alignItems: 'center', 
            paddingTop: '80px', paddingBottom: '80px', position: 'relative' 
        }}>
          {/* Animated orbs */}
          <motion.div
            className="orb orb-purple"
            animate={{ y: [0, 40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 800, height: 800, top: '-20%', left: '-10%', opacity: 0.5 }}
          />
          <motion.div
            className="orb orb-cyan"
            animate={{ y: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{ width: 600, height: 600, bottom: '-10%', right: '-5%', opacity: 0.4 }}
          />
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                flexWrap: 'wrap', gap: '60px' 
            }}>
                
              {/* Left Content */}
              <div style={{ flex: '1 1 500px', maxWidth: '650px' }}>
                <motion.div {...fadeUp(0)}>
                  <span className="badge badge-purple" style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '0.9rem' }}>
                    <Zap size={16} fill="currentColor" />
                    Next-Gen Travel Planning
                  </span>
                </motion.div>

                <motion.h1 {...fadeUp(0.1)} className="hero-title-epic">
                  Plan Trips.<br />
                  <span className="gradient-text">Split Bills.</span><br />
                  No Stress.
                </motion.h1>

                <motion.p {...fadeUp(0.2)} style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '500px' }}>
                  The most beautiful way to discover destinations, track group expenses, and settle debts instantly.
                </motion.p>

                <motion.div {...fadeUp(0.3)} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '60px' }}>
                  <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                    <Sparkles size={20} />
                    Start Planning Free
                  </Link>
                  <Link to="/explore" className="btn btn-outline btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                    <Compass size={20} />
                    Explore
                  </Link>
                </motion.div>

                {/* Stats */}
                <motion.div {...fadeUp(0.4)} style={{ 
                    display: 'flex', gap: '40px', flexWrap: 'wrap', 
                    paddingTop: '40px', borderTop: '1px solid var(--border)' 
                }}>
                  {STATS.map(({ value, label, icon: StatsIcon }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--accent-primary)' }}><StatsIcon size={24} /></div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{label}</div>
                        </div>
                      </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Visual */}
              <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center', perspective: '1000px' }}
              >
                  <img 
                      src="/hero-mockup.png" 
                      alt="TripPlanner App Mockup" 
                      className="animate-float-mockup"
                      style={{ 
                          width: '100%', 
                          maxWidth: '700px', 
                          borderRadius: '24px',
                          border: '1px solid rgba(255,255,255,0.1)'
                      }} 
                  />
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── PREMIUM FEATURES ─────────────────────────────────────────────── */}
        <section style={{ padding: '120px 0', position: 'relative' }}>
          <div className="container">
            <motion.div {...fadeUp(0)} style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px' }}>
                Unmatched <span className="gradient-text">Excellence</span>
              </h2>
              <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                Experience travel planning reimagined with our meticulously crafted features.
              </p>
            </motion.div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '30px' 
            }}>
              {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
                  <motion.div
                    key={title}
                    variants={fadeUp(i * 0.1)}
                    initial="initial"
                    whileInView="whileInView"
                    viewport={{ once: true }}
                    className="glass-premium"
                    style={{ padding: '40px 30px' }}
                  >
                    <div style={{ 
                        width: '60px', height: '60px', borderRadius: '16px', 
                        background: `linear-gradient(135deg, ${color}20, ${color}05)`, 
                        border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: color, marginBottom: '24px',
                        boxShadow: `0 0 20px ${color}20`
                    }}>
                      <Icon size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>{desc}</p>
                  </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── POPULAR TRIPS ────────────────────────────────────────────────── */}
        {trips.length > 0 && (
            <section style={{ padding: '120px 0', background: 'rgba(0,0,0,0.2)' }}>
              <div className="container">
                <motion.div {...fadeUp(0)} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', 
                    marginBottom: '60px', flexWrap: 'wrap', gap: '20px' 
                }}>
                  <div>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
                      Trending <span className="gradient-text-green">Destinations</span>
                    </h2>
                    <p style={{ fontSize: '1.1rem', marginTop: '8px' }}>Curated experiences worldwide</p>
                  </div>
                  <Link to="/explore" className="btn btn-outline" style={{ padding: '12px 24px' }}>
                    View All <ArrowRight size={18} />
                  </Link>
                </motion.div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '30px' 
                }}>
                  {trips.slice(0, 6).map((trip, i) => (
                      <TripCard key={trip.id} trip={trip} delay={i * 0.1} />
                  ))}
                </div>
              </div>
            </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section style={{ padding: '160px 0' }}>
          <div className="container">
            <motion.div {...fadeUp(0)} className="glass-premium" style={{ 
                padding: '80px 40px', textAlign: 'center', borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,101,132,0.1))',
            }}>
              <div className="orb orb-cyan" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '24px', lineHeight: 1.1 }}>
                  Your journey begins <span className="gradient-text">here.</span>
                </h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px' }}>
                  Join the most elegant travel planning platform. Free forever for individuals.
                </p>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: '18px 40px', fontSize: '1.15rem' }}>
                  <Flame size={20} />
                  Create Your Free Account
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
  );
}

function TripCard({ trip, delay }) {
  const categoryColors = {
    ADVENTURE: '#ff6584', RELAXATION: '#43e97b', LUXURY: '#f9c74f',
    BUDGET: '#6c63ff', TREKKING: '#00d2ff', FAMILY: '#ff9f7f',
  };
  const color = categoryColors[trip.category] || '#6c63ff';
  const imageUrl = getPrimaryImageUrl(trip);

  return (
      <motion.div
          variants={fadeUp(delay)}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="glass-premium"
          style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
          {imageUrl ? (
              <img src={imageUrl} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${color}30, ${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={50} color={color} opacity={0.5} />
              </div>
          )}
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>
            {trip.durationDays} Days
          </div>
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: `${color}30`, backdropFilter: 'blur(10px)', color: color, padding: '6px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>
            {trip.category}
          </div>
        </div>

        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{trip.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {trip.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Starting from</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                ₹{trip.pricePerPerson?.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px' }}>
              <Star size={14} color="#f9c74f" fill="#f9c74f" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>4.8</span>
            </div>
          </div>
        </div>
      </motion.div>
  );
}
