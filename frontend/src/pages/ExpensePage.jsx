import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, TrendingUp, TrendingDown,
  ArrowRight, DollarSign, Trash2, PieChart } from 'lucide-react';
import { expenseService, settlementService, userTripService } from '../services';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const CAT_ICONS = { FOOD:'🍔', HOTEL:'🏨', TRANSPORT:'🚌',
  SHOPPING:'🛍️', ACTIVITY:'🎯', MISCELLANEOUS:'📦' };

const unwrapData = (responseData) => responseData?.data ?? responseData;
const unwrapArray = (responseData) => {
  const data = unwrapData(responseData);
  return Array.isArray(data) ? data : [];
};

export default function ExpensePage() {
  const { tripId }             = useParams();
  const navigate               = useNavigate();
  const { user }               = useAuthStore();
  const parsedTripId           = Number(tripId);
  const hasValidTripId         = Number.isInteger(parsedTripId) && parsedTripId > 0;
  const [trip, setTrip]        = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance]  = useState(null);
  const [loading, setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAdd, setShowAdd]  = useState(false);

  const load = useCallback(async () => {
    if (!hasValidTripId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tripRes, expRes, balRes] = await Promise.all([
        userTripService.getOne(parsedTripId),
        expenseService.getByTrip(parsedTripId),
        expenseService.getBalance(parsedTripId),
      ]);
      setTrip(unwrapData(tripRes.data));
      setExpenses(unwrapArray(expRes.data));
      setBalance(unwrapData(balRes.data));
    } catch (_) {
      toast.error('Failed to load expense dashboard');
      setTrip(null);
      setExpenses([]);
      setBalance(null);
    }
    setLoading(false);
  }, [hasValidTripId, parsedTripId]);

  useEffect(() => {
    if (!hasValidTripId) {
      toast.error('Please open expenses from a specific trip');
      navigate('/trips', { replace: true });
      return;
    }

    load();
  }, [tripId, hasValidTripId, navigate, load]);

  const handleDelete = async (id) => {
    try {
      await expenseService.delete(id);
      toast.success('Expense removed');
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete expense');
    }
  };

  const handleSettle = async (tx) => {
    try {
      await settlementService.pay({
        toUserId: tx.toUserId,
        tripId: parsedTripId,
        amount: tx.amount,
        note: 'Debt settlement',
      });
      toast.success(`Settled ₹${tx.amount} with ${tx.toUserName}`);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to settle debt');
    }
  };

  if (loading) return <PageLoader />;

  const totalExpenses = balance?.totalExpenses || 0;
  const currentUserBalance = balance?.balances?.find(b =>
      b.userId === user?.id || b.userName === user?.name
  );

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom:80 }}>

          {/* Header */}
          <div style={{ paddingTop:20, marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div>
                <h2 style={{ marginBottom:6 }}>
                  {trip?.title} —{' '}
                  <span className="gradient-text">Expenses</span>
                </h2>
                <p>{trip?.members?.length + 1} members ·{' '}
                  {expenses.length} expense{expenses.length !== 1 ? 's':''}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Add Expense
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
            gap:16, marginBottom:32 }}>
            {[
              { label:'Total Expenses', value:`₹${totalExpenses?.toLocaleString('en-IN')}`,
                icon: DollarSign, color:'#6c63ff' },
              { label:'My Net Balance',
                value: currentUserBalance
                    ? `INR ${Math.abs(currentUserBalance.netBalance || 0).toLocaleString('en-IN')}`
                    : '—',
                icon: (currentUserBalance?.netBalance || 0) >= 0
                    ? TrendingUp : TrendingDown,
                color: (currentUserBalance?.netBalance || 0) >= 0
                    ? '#43e97b' : '#ff6b6b' },
              { label:'Pending Debts',
                value: balance?.simplifiedTransactions?.length || 0,
                icon: ArrowRight, color:'#f9c74f' },
            ].map(({ label, value, icon:Icon, color }) => (
                <div key={label} className="stat-card">
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)',
                  textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem',
                    fontWeight:700, color }}>{value}</div>
                </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:28,
            background:'var(--bg-card)', borderRadius:'var(--radius-full)',
            padding:4, width:'fit-content' }}>
            {[
              { id:'expenses', label:'Expenses' },
              { id:'balances', label:'Balances' },
              { id:'settle',   label:'Settle Up' },
            ].map(tab => (
                <button key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="btn btn-sm"
                        style={{
                          background: activeTab===tab.id ? 'var(--accent-primary)' : 'transparent',
                          color: activeTab===tab.id ? '#fff' : 'var(--text-secondary)',
                          border:'none',
                        }}>
                  {tab.label}
                </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
                <motion.div key="expenses"
                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                            exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>
                  {expenses.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'60px 0' }}>
                        <div style={{ fontSize:'3rem', marginBottom:12 }}>💸</div>
                        <h3 style={{ marginBottom:8 }}>No expenses yet</h3>
                        <p>Add your first shared expense to start tracking</p>
                      </div>
                  ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {expenses.map((exp, i) => (
                            <motion.div key={exp.id}
                                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                                        transition={{ delay:i*0.04 }}
                                        style={{ background:'var(--bg-card)',
                                          border:'1px solid var(--border)',
                                          borderRadius:'var(--radius-md)', padding:'16px 20px',
                                          display:'flex', alignItems:'center', gap:16 }}>

                              {/* Emoji */}
                              <div style={{ width:42, height:42, borderRadius:12,
                                background:'var(--bg-secondary)', display:'flex',
                                alignItems:'center', justifyContent:'center',
                                fontSize:'1.3rem', flexShrink:0 }}>
                                {CAT_ICONS[exp.category] || '📦'}
                              </div>

                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:600, fontSize:'0.95rem',
                                  marginBottom:3 }}>{exp.description}</div>
                                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)',
                                  display:'flex', gap:10 }}>
                          <span>Paid by <strong style={{ color:'var(--text-secondary)' }}>
                            {exp.paidBy}</strong></span>
                                  <span>·</span>
                                  <span>{exp.splitType} split</span>
                                  <span>·</span>
                                  <span>{exp.splits?.length} people</span>
                                </div>
                              </div>

                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <div style={{ fontFamily:'var(--font-display)',
                                  fontSize:'1.15rem', fontWeight:700,
                                  color:'var(--text-primary)' }}>
                                  ₹{exp.amount?.toLocaleString('en-IN')}
                                </div>
                                <span className="badge badge-purple" style={{ fontSize:'0.68rem' }}>
                          {exp.category}
                        </span>
                              </div>

                              <button className="btn btn-danger btn-icon btn-sm"
                                      onClick={() => handleDelete(exp.id)}>
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                        ))}
                      </div>
                  )}
                </motion.div>
            )}

            {/* BALANCES TAB */}
            {activeTab === 'balances' && (
                <motion.div key="balances"
                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                            exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>
                  <div style={{ display:'grid',
                    gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                    {balance?.balances?.map(b => (
                        <div key={b.userId} style={{
                          background:'var(--bg-card)', border:'1px solid var(--border)',
                          borderRadius:'var(--radius-lg)', padding:20 }}>
                          <div style={{ display:'flex', alignItems:'center',
                            gap:10, marginBottom:14 }}>
                            <div style={{ width:38, height:38, borderRadius:'50%',
                              background:'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontWeight:700, color:'#fff', fontSize:'0.9rem' }}>
                              {b.userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{b.userName}</div>
                              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                                {b.netBalance >= 0 ? '💚 Gets back' : '🔴 Owes'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between',
                            marginBottom:6 }}>
                            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Paid</span>
                            <span style={{ fontSize:'0.88rem', fontWeight:600,
                              color:'var(--accent-green)' }}>
                        ₹{b.totalPaid?.toLocaleString('en-IN')}
                      </span>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between',
                            marginBottom:12 }}>
                            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Owes</span>
                            <span style={{ fontSize:'0.88rem', fontWeight:600,
                              color:'var(--accent-coral)' }}>
                        ₹{b.totalOwed?.toLocaleString('en-IN')}
                      </span>
                          </div>
                          <div style={{ borderTop:'1px solid var(--divider)', paddingTop:12,
                            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'0.82rem', fontWeight:600 }}>Net</span>
                            <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem',
                              fontWeight:700,
                              color: b.netBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-coral)' }}>
                        {b.netBalance >= 0 ? '+' : ''}₹{b.netBalance?.toLocaleString('en-IN')}
                      </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </motion.div>
            )}

            {/* SETTLE UP TAB */}
            {activeTab === 'settle' && (
                <motion.div key="settle"
                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                            exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>
                  <div style={{ marginBottom:20 }}>
                    <h3 style={{ fontSize:'1.05rem', marginBottom:6 }}>
                      Simplified Transactions
                    </h3>
                    <p style={{ fontSize:'0.88rem' }}>
                      Minimum payments to settle all debts in this trip
                    </p>
                  </div>
                  {!balance?.simplifiedTransactions?.length ? (
                      <div style={{ textAlign:'center', padding:'60px 0' }}>
                        <div style={{ fontSize:'3rem', marginBottom:12 }}>🎉</div>
                        <h3 style={{ marginBottom:8 }}>All settled!</h3>
                        <p>No pending debts in this trip</p>
                      </div>
                  ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {balance.simplifiedTransactions.map((tx, i) => (
                            <motion.div key={i}
                                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                                        transition={{ delay:i*0.05 }}
                                        style={{ background:'var(--bg-card)',
                                          border:'1px solid var(--border)',
                                          borderRadius:'var(--radius-md)', padding:'18px 20px',
                                          display:'flex', alignItems:'center', gap:16,
                                          flexWrap:'wrap' }}>
                              <div style={{ flex:1, display:'flex', alignItems:'center',
                                gap:12, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:600, color:'var(--accent-coral)' }}>
                          {tx.fromUserName}
                        </span>
                                <ArrowRight size={16} color="var(--text-muted)" />
                                <span style={{ fontWeight:600, color:'var(--accent-green)' }}>
                          {tx.toUserName}
                        </span>
                                <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem',
                                  fontWeight:700, color:'var(--accent-primary)', marginLeft:8 }}>
                          ₹{tx.amount?.toLocaleString('en-IN')}
                        </span>
                              </div>
                              <button className="btn btn-sm"
                                      style={{ background:'rgba(67,233,123,0.12)',
                                        color:'var(--accent-green)',
                                        border:'1px solid rgba(67,233,123,0.2)' }}
                                      onClick={() => handleSettle(tx)}>
                                Mark Settled
                              </button>
                            </motion.div>
                        ))}
                      </div>
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AddExpenseModal
            isOpen={showAdd}
            tripId={parsedTripId}
            members={trip?.members || []}
            onClose={() => setShowAdd(false)}
            onAdded={() => { setShowAdd(false); load(); }}
        />
      </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({ isOpen, tripId, members, onClose, onAdded }) {
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, watch, reset, formState:{errors} } = useForm({
    defaultValues: { splitType:'EQUAL' }
  });
  const splitType = watch('splitType');

  const onSubmit = async (data) => {
    setAdding(true);
    try {
      const selectedParticipantIds = Array.isArray(data.participantIds)
          ? data.participantIds
          : data.participantIds
              ? [data.participantIds]
              : [];
      const participantIds = selectedParticipantIds.length > 0
          ? selectedParticipantIds.map(Number)
          : members.map(m => m.id);

      await expenseService.add(tripId, {
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        splitType: data.splitType,
        participantIds,
      });
      toast.success('Expense added! 💸');
      reset();
      onAdded();
    } catch (err) {
      toast.error(err?.message || 'Failed to add expense');
    }
    setAdding(false);
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
                          animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92 }}
                          style={{ width:'100%', maxWidth:480, background:'var(--bg-card)',
                            border:'1px solid var(--border)', borderRadius:'var(--radius-xl)',
                            maxHeight:'90vh', overflowY:'auto' }}>

                <div style={{ padding:'24px 24px 0', display:'flex',
                  justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                  <h3>Add Expense</h3>
                  <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}
                      style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <input className={`input-field ${errors.description?'error':''}`}
                           placeholder="e.g. Dinner at mountain café"
                           {...register('description', { required:'Required' })} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div className="input-group">
                      <label className="input-label">Amount (₹)</label>
                      <input type="number" className={`input-field ${errors.amount?'error':''}`}
                             placeholder="0.00" step="0.01"
                             {...register('amount', { required:'Required', min:0.01 })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Category</label>
                      <select className="input-field" {...register('category', { required:true })}>
                        {Object.keys(CAT_ICONS).map(c => (
                            <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Split Type</label>
                    <div style={{ display:'flex', gap:8 }}>
                      {['EQUAL'].map(type => (
                          <label key={type} style={{ flex:1, cursor:'pointer' }}>
                            <input type="radio" value={type} style={{ display:'none' }}
                                   {...register('splitType')} />
                            <div style={{
                              textAlign:'center', padding:'10px 8px',
                              borderRadius:'var(--radius-md)', fontSize:'0.82rem',
                              fontWeight:600, border:'1px solid',
                              borderColor: splitType===type ? 'var(--accent-primary)' : 'var(--border)',
                              background: splitType===type ? 'rgba(108,99,255,0.12)' : 'var(--bg-secondary)',
                              color: splitType===type ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              transition:'all 0.15s',
                            }}>
                              {type}
                            </div>
                          </label>
                      ))}
                    </div>
                  </div>

                  {members.length > 0 && (
                      <div className="input-group">
                        <label className="input-label">Participants</label>
                        <select className="input-field" multiple style={{ height:90 }}
                                {...register('participantIds')}>
                          {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                  )}

                  <div style={{ display:'flex', gap:12, paddingTop:4 }}>
                    <button type="button" className="btn btn-outline" style={{ flex:1 }}
                            onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex:1 }}
                            disabled={adding}>
                      {adding ? <span className="spinner" /> : '💸 Add Expense'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
}

function PageLoader() {
  return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center',
        justifyContent:'center' }}>
        <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
      </div>
  );
}
