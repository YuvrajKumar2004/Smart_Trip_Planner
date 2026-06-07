import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, DollarSign, TrendingDown, CheckCircle,
  AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { recommendationService } from '../services';
import { formatINR, CATEGORY_COLORS } from '../utils/helpers';

export default function RecommendationPage() {
  const [activeTab, setActiveTab]       = useState('recommend');
  const [results, setResults]           = useState(null);
  const [budgetResult, setBudgetResult] = useState(null);
  const [loading, setLoading]           = useState(false);

  const recForm    = useForm();
  const budgetForm = useForm();

  // ── Recommendation submit ─────────────────────────────────────────────────
  const onRecommend = async (data) => {
    setLoading(true);
    setResults(null);
    try {
      const res = await recommendationService.recommend({
        budgetPerPerson:    Number(data.budgetPerPerson),
        startDate:          data.startDate,
        endDate:            data.endDate,
        numberOfTravelers:  Number(data.numberOfTravelers),
        preferredCategory:  data.category !== 'ALL' ? data.category : undefined,
        preferredTransport: data.transport !== 'ALL' ? data.transport : undefined,
        preferredSeason:    data.season || undefined,
        maxDurationDays:    data.maxDays ? Number(data.maxDays) : undefined,
      });
      setResults(res.data || []);
      if (!res.data?.length) toast('No trips matched your preferences', { icon: '🔍' });
    } catch { toast.error('Failed to fetch recommendations'); }
    setLoading(false);
  };

  // ── Budget optimize submit ────────────────────────────────────────────────
  const onOptimize = async (data) => {
    setLoading(true);
    setBudgetResult(null);
    try {
      const res = await recommendationService.optimizeBudget({
        totalBudget:       Number(data.totalBudget),
        numberOfTravelers: Number(data.numberOfTravelers),
        startDate:         data.startDate,
        endDate:           data.endDate,
        preferredTransport: data.transport !== 'ALL' ? data.transport : undefined,
        destinationIds:    data.destinations
            ? (Array.isArray(data.destinations)
                ? data.destinations.map(Number) : [Number(data.destinations)])
            : [],
      });
      setBudgetResult(res.data);
    } catch { toast.error('Failed to analyze budget'); }
    setLoading(false);
  };

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom: 80 }}>

          {/* Header */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      style={{ paddingTop: 20, marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ padding: '4px 12px', background: 'rgba(108,99,255,0.12)',
                border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={12} fill="currentColor" /> AI-Powered
              </div>
            </div>
            <h2>Smart <span className="gradient-text">Trip Planner</span></h2>
            <p>Get personalized recommendations or analyze your budget</p>
          </motion.div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 32,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-full)',
            padding: 4, width: 'fit-content' }}>
            {[
              { id: 'recommend', label: '✨ Recommendations' },
              { id: 'budget',    label: '💰 Budget Optimizer' },
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="btn btn-sm"
                        style={{
                          background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                          color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                        }}>
                  {tab.label}
                </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── RECOMMENDATION TAB ──────────────────────────────────────────── */}
            {activeTab === 'recommend' && (
                <motion.div key="rec" initial={{ opacity:0, y:10 }}
                            animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                  <div style={{ display: 'grid',
                    gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'start' }}>

                    {/* Form */}
                    <div className="glass-card" style={{ padding: 28 }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: 22 }}>
                        Your Preferences
                      </h3>
                      <form onSubmit={recForm.handleSubmit(onRecommend)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        <div className="input-group">
                          <label className="input-label">Budget per person (₹)</label>
                          <input type="number" className="input-field" placeholder="e.g. 15000"
                                 {...recForm.register('budgetPerPerson', { required: true })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <input type="date" className="input-field"
                                   {...recForm.register('startDate', { required: true })} />
                          </div>
                          <div className="input-group">
                            <label className="input-label">End Date</label>
                            <input type="date" className="input-field"
                                   {...recForm.register('endDate', { required: true })} />
                          </div>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Travelers</label>
                          <input type="number" className="input-field" defaultValue={2}
                                 {...recForm.register('numberOfTravelers', { required: true })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="input-group">
                            <label className="input-label">Category</label>
                            <select className="input-field" {...recForm.register('category')}>
                              {['ALL','ADVENTURE','RELAXATION','LUXURY','BUDGET',
                                'TREKKING','FAMILY'].map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="input-group">
                            <label className="input-label">Transport</label>
                            <select className="input-field" {...recForm.register('transport')}>
                              {['ALL','FLIGHT','TRAIN','BUS','CAR','MIXED']
                                  .map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="input-group">
                            <label className="input-label">Season</label>
                            <input className="input-field" placeholder="e.g. Winter"
                                   {...recForm.register('season')} />
                          </div>
                          <div className="input-group">
                            <label className="input-label">Max Days</label>
                            <input type="number" className="input-field" placeholder="e.g. 7"
                                   {...recForm.register('maxDays')} />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                                disabled={loading}>
                          {loading
                              ? <><span className="spinner" /> Finding trips...</>
                              : <><Zap size={15} /> Get Recommendations</>}
                        </button>
                      </form>
                    </div>

                    {/* Results */}
                    <div>
                      {!results && !loading && (
                          <div style={{ textAlign: 'center', padding: '60px 20px',
                            color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🗺️</div>
                            <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
                              Fill in your preferences
                            </h3>
                            <p>We'll find the best trips matching your budget and style</p>
                          </div>
                      )}

                      {results?.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                            <h3 style={{ marginBottom: 8 }}>No matches found</h3>
                            <p>Try adjusting your budget or preferences</p>
                          </div>
                      )}

                      {results?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)',
                              marginBottom: 4 }}>
                              Found <strong style={{ color: 'var(--text-primary)' }}>
                              {results.length}
                            </strong> matching trips
                            </div>
                            {results.map((trip, i) => (
                                <RecommendationCard key={trip.tripId} trip={trip} rank={i+1} />
                            ))}
                          </div>
                      )}
                    </div>
                  </div>
                </motion.div>
            )}

            {/* ── BUDGET OPTIMIZER TAB ────────────────────────────────────────── */}
            {activeTab === 'budget' && (
                <motion.div key="budget" initial={{ opacity:0, y:10 }}
                            animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                  <div style={{ display: 'grid',
                    gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'start' }}>

                    {/* Form */}
                    <div className="glass-card" style={{ padding: 28 }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: 22 }}>
                        Trip Details
                      </h3>
                      <form onSubmit={budgetForm.handleSubmit(onOptimize)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        <div className="input-group">
                          <label className="input-label">Total Budget (₹)</label>
                          <input type="number" className="input-field" placeholder="e.g. 50000"
                                 {...budgetForm.register('totalBudget', { required: true })} />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Travelers</label>
                          <input type="number" className="input-field" defaultValue={2}
                                 {...budgetForm.register('numberOfTravelers', { required: true })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <input type="date" className="input-field"
                                   {...budgetForm.register('startDate', { required: true })} />
                          </div>
                          <div className="input-group">
                            <label className="input-label">End Date</label>
                            <input type="date" className="input-field"
                                   {...budgetForm.register('endDate', { required: true })} />
                          </div>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Transport Mode</label>
                          <select className="input-field" {...budgetForm.register('transport')}>
                            {['FLIGHT','TRAIN','BUS','CAR','MIXED']
                                .map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            Destination IDs (comma separated)
                          </label>
                          <input className="input-field" placeholder="e.g. 1,2,3"
                                 {...budgetForm.register('destinations', { required: true })}
                                 onChange={e => {
                                   const ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                   budgetForm.setValue('destinations', ids);
                                 }} />
                          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                        Get destination IDs from the Explore page
                      </span>
                        </div>

                        <button type="submit" className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                                disabled={loading}>
                          {loading
                              ? <><span className="spinner" /> Analyzing...</>
                              : <><DollarSign size={15} /> Analyze Budget</>}
                        </button>
                      </form>
                    </div>

                    {/* Budget result */}
                    <div>
                      {!budgetResult && !loading && (
                          <div style={{ textAlign: 'center', padding: '60px 20px',
                            color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>💰</div>
                            <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
                              Enter your trip details
                            </h3>
                            <p>We'll calculate costs and suggest optimizations</p>
                          </div>
                      )}

                      {budgetResult && <BudgetResultCard result={budgetResult} />}
                    </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
}

// ── Recommendation Result Card ────────────────────────────────────────────────
function RecommendationCard({ trip, rank }) {
  const color = CATEGORY_COLORS[trip.category] || '#6c63ff';
  const score = trip.matchScore || 0;

  return (
      <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: rank * 0.05 }}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: 22, position: 'relative',
                    overflow: 'hidden' }}>

        {/* Rank */}
        <div style={{ position: 'absolute', top: 16, right: 16,
          background: `${color}20`, border: `1px solid ${color}40`,
          borderRadius: 'var(--radius-full)', padding: '3px 12px',
          fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
          #{rank}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 6, paddingRight: 48 }}>
              {trip.tripTitle}
            </h3>

            {/* Match score bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Match score
              </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color }}>
                {trip.matchPercentage}
              </span>
              </div>
              <div style={{ height: 5, background: 'var(--bg-secondary)',
                borderRadius: 3, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                            style={{ height: '100%', background: color, borderRadius: 3 }} />
              </div>
            </div>

            {/* Match reasons */}
            {trip.matchReasons?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {trip.matchReasons.map((reason, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: '0.78rem', color: 'var(--text-secondary)',
                        background: 'var(--bg-secondary)', padding: '3px 8px',
                        borderRadius: 'var(--radius-full)' }}>
                  <CheckCircle size={10} color="var(--accent-green)" /> {reason}
                </span>
                  ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: 20, alignItems: 'center',
              flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Per person
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {formatINR(trip.pricePerPerson)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Group total
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '1.1rem', color }}>
                  {formatINR(trip.totalCostForGroup)}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <a href={`/explore/${trip.tripId}`} className="btn btn-sm"
                   style={{ background: `${color}15`, color,
                     border: `1px solid ${color}30` }}>
                  View Trip <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
  );
}

// ── Budget Result Card ────────────────────────────────────────────────────────
function BudgetResultCard({ result }) {
  const { withinBudget, totalBudget, estimatedCost, difference,
    costBreakdown: cb, suggestions, verdict } = result;

  const COST_ITEMS = [
    { label: 'Transport',     value: cb?.transportCost, color: '#6c63ff' },
    { label: 'Hotel',         value: cb?.hotelCost,     color: '#ff6584' },
    { label: 'Food',          value: cb?.foodCost,      color: '#43e97b' },
    { label: 'Activities',    value: cb?.activityCost,  color: '#f9c74f' },
    { label: 'Miscellaneous', value: cb?.miscCost,      color: '#00d2ff' },
  ];

  return (
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>

        {/* Verdict banner */}
        <div style={{
          background: withinBudget ? 'rgba(67,233,123,0.1)' : 'rgba(255,107,107,0.1)',
          border: `1px solid ${withinBudget ? 'rgba(67,233,123,0.25)' : 'rgba(255,107,107,0.25)'}`,
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {withinBudget
              ? <CheckCircle size={20} color="var(--accent-green)" />
              : <AlertTriangle size={20} color="var(--accent-coral)" />}
          <p style={{ color: withinBudget ? 'var(--accent-green)' : 'var(--accent-coral)',
            fontWeight: 500, fontSize: '0.92rem', margin: 0 }}>
            {verdict}
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>💰 Cost Breakdown</h3>

          {/* Budget vs cost bars */}
          <div style={{ marginBottom: 20 }}>
            {[
              { label: 'Your Budget', value: totalBudget, color: 'var(--accent-green)' },
              { label: 'Estimated Cost', value: estimatedCost,
                color: withinBudget ? 'var(--accent-primary)' : 'var(--accent-coral)' },
            ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginBottom: 5, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{formatINR(value)}</span>
                  </div>
                  <div style={{ height: 7, background: 'var(--bg-secondary)',
                    borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((value / Math.max(totalBudget, estimatedCost)) * 100, 100)}%` }}
                        transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                </div>
            ))}
          </div>

          {/* Per-component breakdown */}
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {COST_ITEMS.map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)',
                    marginBottom: 5 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color }}>
                    {formatINR(value)}
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Optimization suggestions */}
        {!withinBudget && suggestions?.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>
                💡 Optimization Suggestions
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                Sorted by potential savings
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map((s, i) => (
                    <motion.div key={i}
                                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                                transition={{ delay: i * 0.08 }}
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 12,
                                  background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                                  padding: '14px 16px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8,
                        background: 'rgba(108,99,255,0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                        color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {String(i+1).padStart(2,'0')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)',
                          marginBottom: 4 }}>{s.suggestion}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {s.type}
                        </div>
                      </div>
                      {s.potentialSaving > 0 && (
                          <div style={{ flexShrink: 0, fontWeight: 700, fontSize: '0.9rem',
                            color: 'var(--accent-green)' }}>
                            <TrendingDown size={12} style={{ display:'inline', marginRight:3 }} />
                            {formatINR(s.potentialSaving)}
                          </div>
                      )}
                    </motion.div>
                ))}
              </div>
            </div>
        )}
      </motion.div>
  );
}