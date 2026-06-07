import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Map, Users, Calendar, ArrowRight,
  Trash2, Edit, X, ChevronRight } from 'lucide-react';
import { userTripService, destinationService } from '../services';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PLANNING:'#6c63ff', ONGOING:'#43e97b', COMPLETED:'#9898b3', CANCELLED:'#ff6b6b',
};

const unwrapPage = (responseData) => {
  const pageData = responseData?.data ?? responseData;
  return {
    content: Array.isArray(pageData?.content) ? pageData.content : [],
    totalPages: Number.isFinite(Number(pageData?.totalPages)) ? Number(pageData.totalPages) : 0,
  };
};

export default function MyTripsPage({ expenseMode = false }) {
  const navigate = useNavigate();
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTrips = async (p = 0) => {
    setLoading(true);
    try {
      const res = await userTripService.getAll({ page: p, size: 9 });
      const tripPage = unwrapPage(res.data);
      setTrips(tripPage.content);
      setTotalPages(tripPage.totalPages);
    } catch (_) {
      toast.error('Failed to load trips');
      setTrips([]);
      setTotalPages(0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await userTripService.delete(id);
      toast.success('Trip deleted');
      fetchTrips(page);
    } catch (_) {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await userTripService.updateStatus(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchTrips(page);
    } catch (_) {}
  };

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom:80 }}>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-start', paddingTop:20, marginBottom:36, flexWrap:'wrap', gap:16 }}>
            <div>
              <h2 style={{ marginBottom:6 }}>
                {expenseMode ? 'Trip ' : 'My '}
                <span className="gradient-text">{expenseMode ? 'Expenses' : 'Trips'}</span>
              </h2>
              <p>{expenseMode ? 'Choose a trip to open its expense dashboard' : 'Plan and manage all your trips in one place'}</p>
            </div>
            {!expenseMode && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={16} /> New Trip
                </button>
            )}
          </div>

          {loading ? (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
                {Array(3).fill(0).map((_,i) => <TripSkeleton key={i} />)}
              </div>
          ) : trips.length === 0 ? (
              <EmptyTrips onNew={() => setShowCreate(true)} />
          ) : (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
                {trips.map((trip, i) => (
                    <TripCard key={trip.id} trip={trip} delay={i*0.05}
                              expenseMode={expenseMode}
                              onClick={() => navigate(expenseMode ? `/trips/${trip.id}/expenses` : `/trips/${trip.id}`)}
                              onDelete={() => handleDelete(trip.id)}
                              onStatusChange={handleStatusChange} />
                ))}
              </div>
          )}

          {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                {Array.from({ length: totalPages }, (_,i) => (
                    <button key={i} onClick={() => { setPage(i); fetchTrips(i); }}
                            className="btn btn-sm"
                            style={{ minWidth:38,
                              background: page===i ? 'var(--accent-primary)' : 'var(--bg-card)',
                              color: page===i ? '#fff' : 'var(--text-secondary)',
                              border:`1px solid ${page===i ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                      {i+1}
                    </button>
                ))}
              </div>
          )}
        </div>

        <CreateTripModal
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchTrips(); }}
        />
      </div>
  );
}

function TripCard({ trip, delay, expenseMode, onClick, onDelete, onStatusChange }) {
  const color = STATUS_COLORS[trip.status] || '#6c63ff';
  return (
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.4, delay }}
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-lg)', overflow:'hidden', position:'relative' }}>

        {/* Status stripe */}
        <div style={{ height:4, background:`linear-gradient(90deg,${color},${color}44)` }} />

        <div style={{ padding:'20px 20px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-start', marginBottom:12 }}>
            <h3 style={{ fontSize:'1rem', fontWeight:600, cursor:'pointer',
              flex:1, marginRight:8 }} onClick={onClick}>
              {trip.title}
            </h3>
            <span className="badge" style={{ background:`${color}18`, color,
              flexShrink:0, fontSize:'0.7rem' }}>
            {trip.status}
          </span>
          </div>

          <p style={{ fontSize:'0.84rem', color:'var(--text-secondary)', marginBottom:16,
            display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {trip.description || 'No description'}
          </p>

          {/* Meta */}
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:16 }}>
            {[
              { icon: Calendar, text:`${trip.startDate} → ${trip.endDate}` },
              { icon: Users, text:`${trip.members?.length || 1} member${trip.members?.length > 1 ? 's' : ''}` },
              { icon: Map, text:`${trip.destinations?.length || 0} destination${trip.destinations?.length !== 1 ? 's' : ''}` },
            ].map(({ icon:Icon, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:7,
                  fontSize:'0.84rem', color:'var(--text-secondary)' }}>
                  <Icon size={13} color="var(--text-muted)" /> {text}
                </div>
            ))}
          </div>

          {/* Budget bar */}
          <div style={{ background:'var(--bg-secondary)', borderRadius:'var(--radius-md)',
            padding:'10px 12px', marginBottom:14, display:'flex',
            justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Budget</span>
            <span style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--accent-green)' }}>
            ₹{trip.minBudget?.toLocaleString('en-IN')} –{' '}
              ₹{trip.maxBudget?.toLocaleString('en-IN')}
          </span>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm btn-outline" style={{ flex:1 }}
                    onClick={onClick}>
              {expenseMode ? 'Open Expenses' : 'View'} <ChevronRight size={13} />
            </button>

            {!expenseMode && trip.status === 'PLANNING' && (
                <button className="btn btn-sm"
                        style={{ background:'rgba(67,233,123,0.12)', color:'var(--accent-green)',
                          border:'1px solid rgba(67,233,123,0.2)' }}
                        onClick={() => onStatusChange(trip.id, 'ONGOING')}>
                  Start
                </button>
            )}
            {!expenseMode && trip.status === 'ONGOING' && (
                <button className="btn btn-sm"
                        style={{ background:'rgba(67,233,123,0.12)', color:'var(--accent-green)',
                          border:'1px solid rgba(67,233,123,0.2)' }}
                        onClick={() => onStatusChange(trip.id, 'COMPLETED')}>
                  Complete
                </button>
            )}

            {!expenseMode && (
                <button className="btn btn-sm btn-danger btn-icon"
                        onClick={e => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 size={14} />
                </button>
            )}
          </div>
        </div>
      </motion.div>
  );
}

// ── Create Trip Modal ─────────────────────────────────────────────────────────
function CreateTripModal({ isOpen, onClose, onCreated }) {
  const [destinations, setDestinations] = useState([]);
  const [creating, setCreating]         = useState(false);
  const { register, handleSubmit, reset, formState:{ errors } } = useForm();

  useEffect(() => {
    destinationService.getAll().then(res => setDestinations(res.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      const payload = {
        ...data,
        minBudget: Number(data.minBudget),
        maxBudget: Number(data.maxBudget),
        numberOfTravelers: Number(data.numberOfTravelers),
        destinationIds: data.destinationIds
            ? (Array.isArray(data.destinationIds)
                ? data.destinationIds.map(Number)
                : [Number(data.destinationIds)])
            : [],
      };
      await userTripService.create(payload);
      toast.success('Trip created! 🗺️');
      reset();
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to create trip');
    }
    setCreating(false);
  };

  return (
      <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
                          backdropFilter:'blur(6px)', zIndex:2000, display:'flex',
                          alignItems:'center', justifyContent:'center', padding:16 }}
                        onClick={e => e.target===e.currentTarget && onClose()}>

              <motion.div initial={{ opacity:0, scale:0.92, y:20 }}
                          animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92, y:20 }}
                          style={{ width:'100%', maxWidth:580, background:'var(--bg-card)',
                            border:'1px solid var(--border)', borderRadius:'var(--radius-xl)',
                            overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>

                {/* Modal header */}
                <div style={{ padding:'24px 28px 0', display:'flex',
                  justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                  <h3>Create New Trip</h3>
                  <button onClick={onClose} className="btn btn-ghost btn-icon">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}
                      style={{ padding:'0 28px 28px', display:'flex',
                        flexDirection:'column', gap:18 }}>

                  <div className="input-group">
                    <label className="input-label">Trip Title</label>
                    <input className={`input-field ${errors.title?'error':''}`}
                           placeholder="e.g. Summer Himalayan Adventure"
                           {...register('title', { required:'Title is required' })} />
                    {errors.title && <span className="input-error">{errors.title.message}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea className="input-field" rows={3}
                              placeholder="What's this trip about?"
                              style={{ resize:'vertical' }}
                              {...register('description')} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div className="input-group">
                      <label className="input-label">Start Date</label>
                      <input type="date" className={`input-field ${errors.startDate?'error':''}`}
                             {...register('startDate', { required:'Required' })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">End Date</label>
                      <input type="date" className={`input-field ${errors.endDate?'error':''}`}
                             {...register('endDate', { required:'Required' })} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div className="input-group">
                      <label className="input-label">Min Budget (₹)</label>
                      <input type="number" className={`input-field ${errors.minBudget?'error':''}`}
                             placeholder="10000"
                             {...register('minBudget', { required:'Required', min:0 })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Max Budget (₹)</label>
                      <input type="number" className={`input-field ${errors.maxBudget?'error':''}`}
                             placeholder="30000"
                             {...register('maxBudget', { required:'Required', min:0 })} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div className="input-group">
                      <label className="input-label">Travelers</label>
                      <input type="number" className="input-field" min={1} defaultValue={2}
                             {...register('numberOfTravelers', { required:true, min:1 })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Trip Type</label>
                      <select className="input-field" {...register('tripType', { required:true })}>
                        {['ADVENTURE','BUDGET','LUXURY','FAMILY','BACKPACKING'].map(t => (
                            <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Transport Mode</label>
                    <select className="input-field" {...register('transportMode')}>
                      {['FLIGHT','TRAIN','BUS','CAR','BIKE','MIXED'].map(t => (
                          <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {destinations.length > 0 && (
                      <div className="input-group">
                        <label className="input-label">Destinations (hold Ctrl to multi-select)</label>
                        <select className="input-field" multiple style={{ height:100 }}
                                {...register('destinationIds')}>
                          {destinations.map(d => (
                              <option key={d.id} value={d.id}>{d.name} — {d.state}</option>
                          ))}
                        </select>
                      </div>
                  )}

                  <div style={{ display:'flex', gap:12, paddingTop:4 }}>
                    <button type="button" className="btn btn-outline" style={{ flex:1 }}
                            onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex:1 }}
                            disabled={creating}>
                      {creating ? <span className="spinner" /> : '🗺️ Create Trip'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
}

function TripSkeleton() {
  return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', overflow:'hidden', padding:20 }}>
        <div style={{ height:4, background:'var(--bg-secondary)', marginBottom:16 }} />
        {[80,60,100,60].map((w,i) => (
            <div key={i} style={{ height:14, borderRadius:6, background:'var(--bg-secondary)',
              width:`${w}%`, marginBottom:10, animation:'pulse 1.5s ease-in-out infinite' }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
  );
}

function EmptyTrips({ onNew }) {
  return (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ textAlign:'center', padding:'80px 40px' }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>✈️</div>
        <h3 style={{ marginBottom:8 }}>No trips yet</h3>
        <p style={{ marginBottom:28 }}>Start planning your first adventure!</p>
        <button className="btn btn-primary" onClick={onNew}>
          <Plus size={16} /> Create Your First Trip
        </button>
      </motion.div>
  );
}
