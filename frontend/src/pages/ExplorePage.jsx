import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, Clock, Star,
  ArrowRight, X, ChevronDown } from 'lucide-react';
import { predefinedTripService } from '../services';
import { debounce, getPrimaryImageUrl } from '../utils/helpers';

const CATEGORIES = ['ALL','ADVENTURE','RELAXATION','LUXURY','BUDGET','TREKKING','FAMILY','BACKPACKING'];
const TRANSPORTS = ['ALL','FLIGHT','TRAIN','BUS','CAR','MIXED'];
const SEASONS    = ['ALL','Summer','Winter','Monsoon','Spring','Autumn'];

const CAT_COLORS = {
  ADVENTURE:'#ff6584', RELAXATION:'#43e97b', LUXURY:'#f9c74f',
  BUDGET:'#6c63ff',   TREKKING:'#00d2ff',   FAMILY:'#ff9f7f', BACKPACKING:'#a78bfa',
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '', category: 'ALL', minBudget: '', maxBudget: '',
    bestSeason: 'ALL', transportMode: 'ALL', maxDurationDays: '',
  });

  const fetchTrips = useCallback(async (f, p = 0) => {
    setLoading(true);
    try {
      const params = {
        page: p, size: 9,
        ...(f.keyword        && { keyword: f.keyword }),
        ...(f.category !== 'ALL'      && { category: f.category }),
        ...(f.minBudget      && { minBudget: f.minBudget }),
        ...(f.maxBudget      && { maxBudget: f.maxBudget }),
        ...(f.bestSeason !== 'ALL'    && { bestSeason: f.bestSeason }),
        ...(f.transportMode !== 'ALL' && { transportMode: f.transportMode }),
        ...(f.maxDurationDays && { maxDurationDays: f.maxDurationDays }),
      };
      const hasFilter = Object.keys(params).length > 2;
      const res = hasFilter
          ? await predefinedTripService.search(params)
          : await predefinedTripService.getAll(params);
      setTrips(res.data?.data?.content || []);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (_) {}
    setLoading(false);
  }, []);

  // Debounce keyword search
  const debouncedFetch = useCallback(debounce((f) => fetchTrips(f, 0), 400), [fetchTrips]);

  useEffect(() => { fetchTrips(filters, 0); }, []);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    setPage(0);
    if (key === 'keyword') debouncedFetch(updated);
    else fetchTrips(updated, 0);
  };

  const clearFilters = () => {
    const reset = { keyword:'', category:'ALL', minBudget:'', maxBudget:'',
      bestSeason:'ALL', transportMode:'ALL', maxDurationDays:'' };
    setFilters(reset);
    setPage(0);
    fetchTrips(reset, 0);
  };

  const activeFilterCount = [
    filters.category !== 'ALL', filters.minBudget, filters.maxBudget,
    filters.bestSeason !== 'ALL', filters.transportMode !== 'ALL', filters.maxDurationDays,
  ].filter(Boolean).length;

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ paddingTop: 20, marginBottom: 40 }}>
            <motion.h2
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                style={{ marginBottom: 8 }}>
              Explore <span className="gradient-text">Destinations</span>
            </motion.h2>
            <motion.p initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay: 0.1 }}>
              Discover handpicked trips across India and beyond
            </motion.p>
          </div>

          {/* Search + Filter Bar */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay: 0.15 }}
                      style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>

            {/* Search */}
            <div style={{ flex:1, minWidth:220, position:'relative' }}>
              <Search size={16} style={{ position:'absolute', left:14,
                top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input
                  className="input-field"
                  style={{ paddingLeft:40 }}
                  placeholder="Search destinations, trips..."
                  value={filters.keyword}
                  onChange={e => handleFilterChange('keyword', e.target.value)}
              />
            </div>

            {/* Category pills */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {CATEGORIES.slice(0,5).map(cat => (
                  <button key={cat} onClick={() => handleFilterChange('category', cat)}
                          className="btn btn-sm"
                          style={{
                            background: filters.category === cat
                                ? (cat === 'ALL' ? 'var(--accent-primary)' : `${CAT_COLORS[cat]}22`)
                                : 'var(--bg-card)',
                            color: filters.category === cat
                                ? (cat === 'ALL' ? '#fff' : CAT_COLORS[cat] || 'var(--accent-primary)')
                                : 'var(--text-secondary)',
                            border: `1px solid ${filters.category === cat
                                ? (cat === 'ALL' ? 'var(--accent-primary)' : CAT_COLORS[cat] || 'var(--accent-primary)')
                                : 'var(--border)'}`,
                          }}>
                    {cat}
                  </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-outline btn-sm"
                    style={{ position:'relative', borderColor: activeFilterCount > 0
                          ? 'var(--accent-primary)' : 'var(--border)',
                      color: activeFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                  <span style={{ background:'var(--accent-primary)', color:'#fff',
                    borderRadius:'50%', width:18, height:18, fontSize:'0.7rem',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:700, position:'absolute', top:-6, right:-6 }}>
                {activeFilterCount}
              </span>
              )}
            </button>

            {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                  <X size={14} /> Clear
                </button>
            )}
          </motion.div>

          {/* Advanced Filters Drawer */}
          <AnimatePresence>
            {showFilters && (
                <motion.div
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }}
                    style={{ overflow:'hidden', marginBottom:24 }}>
                  <div className="glass-card" style={{ padding:24,
                    display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
                    gap:16 }}>

                    <div className="input-group">
                      <label className="input-label">Min Budget (₹)</label>
                      <input className="input-field" type="number" placeholder="e.g. 5000"
                             value={filters.minBudget}
                             onChange={e => handleFilterChange('minBudget', e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Max Budget (₹)</label>
                      <input className="input-field" type="number" placeholder="e.g. 25000"
                             value={filters.maxBudget}
                             onChange={e => handleFilterChange('maxBudget', e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Max Duration (days)</label>
                      <input className="input-field" type="number" placeholder="e.g. 7"
                             value={filters.maxDurationDays}
                             onChange={e => handleFilterChange('maxDurationDays', e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Season</label>
                      <select className="input-field" value={filters.bestSeason}
                              onChange={e => handleFilterChange('bestSeason', e.target.value)}>
                        {SEASONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Transport</label>
                      <select className="input-field" value={filters.transportMode}
                              onChange={e => handleFilterChange('transportMode', e.target.value)}>
                        {TRANSPORTS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Trip Grid */}
          {loading ? (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
                {Array(6).fill(0).map((_,i) => <TripSkeleton key={i} />)}
              </div>
          ) : trips.length === 0 ? (
              <EmptyState onClear={clearFilters} />
          ) : (
              <>
                <div style={{ display:'grid',
                  gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
                  {trips.map((trip, i) => (
                      <TripCard key={trip.id} trip={trip} delay={i * 0.04}
                                onClick={() => navigate(`/explore/${trip.id}`)} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:48 }}>
                      {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} onClick={() => { setPage(i); fetchTrips(filters, i); }}
                                  className="btn btn-sm"
                                  style={{ minWidth:40,
                                    background: page === i ? 'var(--accent-primary)' : 'var(--bg-card)',
                                    color: page === i ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${page === i ? 'var(--accent-primary)' : 'var(--border)'}`,
                                  }}>
                            {i + 1}
                          </button>
                      ))}
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
}

function TripCard({ trip, delay, onClick }) {
  const color = CAT_COLORS[trip.category] || '#6c63ff';
  const imageUrl = getPrimaryImageUrl(trip);
  return (
      <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, delay }} whileHover={{ y:-6 }}
          onClick={onClick}
          style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer',
            transition:'border-color 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`;
            e.currentTarget.style.boxShadow = `0 12px 40px ${color}20`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ height:190, background:`linear-gradient(135deg,${color}25,${color}08)`,
          position:'relative', overflow:'hidden', display:'flex',
          alignItems:'center', justifyContent:'center' }}>
          {imageUrl
              ? <img src={imageUrl} alt={trip.title}
                     style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <MapPin size={44} color={color} opacity={0.4} />
          }
          {/* Overlay badges */}
          <div style={{ position:'absolute', top:12, left:12 }}>
          <span className="badge" style={{ background:`${color}22`, color,
            backdropFilter:'blur(8px)' }}>
            {trip.category}
          </span>
          </div>
          <div style={{ position:'absolute', top:12, right:12,
            background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)',
            borderRadius:'var(--radius-full)', padding:'4px 10px',
            fontSize:'0.75rem', fontWeight:600, color:'#fff',
            display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={11} /> {trip.durationDays}D
          </div>
        </div>

        <div style={{ padding:'18px 20px 20px' }}>
          <h3 style={{ fontSize:'1rem', fontWeight:600, marginBottom:6,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {trip.title}
          </h3>
          <p style={{ fontSize:'0.84rem', marginBottom:14, color:'var(--text-secondary)',
            display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {trip.description}
          </p>

          {/* Destinations chips */}
          {trip.destinations?.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
                {trip.destinations.slice(0,3).map(d => (
                    <span key={d.id} style={{ fontSize:'0.72rem', padding:'2px 8px',
                      background:'var(--bg-secondary)', borderRadius:'var(--radius-full)',
                      color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}>
                <MapPin size={9} /> {d.name}
              </span>
                ))}
                {trip.destinations.length > 3 && (
                    <span style={{ fontSize:'0.72rem', padding:'2px 8px',
                      background:'var(--bg-secondary)', borderRadius:'var(--radius-full)',
                      color:'var(--text-muted)' }}>
                +{trip.destinations.length - 3}
              </span>
                )}
              </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-end' }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)',
                textTransform:'uppercase', letterSpacing:'0.05em' }}>From</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700,
                fontSize:'1.25rem', color:'var(--text-primary)', lineHeight:1.1 }}>
                ₹{trip.pricePerPerson?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>per person</div>
            </div>
            <button className="btn btn-sm" style={{ background:`${color}15`,
              color, border:`1px solid ${color}30` }}>
              View <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
  );
}

function TripSkeleton() {
  return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <div style={{ height:190, background:'var(--bg-secondary)',
          animation:'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ height:18, borderRadius:6, background:'var(--bg-secondary)',
            width:'70%', animation:'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height:14, borderRadius:6, background:'var(--bg-secondary)',
            animation:'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height:14, borderRadius:6, background:'var(--bg-secondary)',
            width:'80%', animation:'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
  );
}

function EmptyState({ onClear }) {
  return (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ textAlign:'center', padding:'80px 40px' }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>🗺️</div>
        <h3 style={{ marginBottom:8 }}>No trips found</h3>
        <p style={{ marginBottom:24 }}>Try adjusting your filters or search terms</p>
        <button className="btn btn-primary" onClick={onClear}>Clear all filters</button>
      </motion.div>
  );
}
