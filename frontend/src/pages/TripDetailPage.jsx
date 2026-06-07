import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, Train, Users,
  Star, ArrowLeft, CheckCircle, Tag } from 'lucide-react';
import { predefinedTripService, bookingService } from '../services';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getPrimaryImageUrl } from '../utils/helpers';

const CAT_COLORS = {
  ADVENTURE:'#ff6584', RELAXATION:'#43e97b', LUXURY:'#f9c74f',
  BUDGET:'#6c63ff',   TREKKING:'#00d2ff',   FAMILY:'#ff9f7f',
};

export default function TripDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [trip, setTrip]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { register, handleSubmit, watch, setValue, formState:{ errors } } = useForm({
    defaultValues: { participantCount: 1 }
  });
  const count = Number(watch('participantCount', 1)) || 1;

  useEffect(() => {
    predefinedTripService.getOne(id)
        .then(res => setTrip(res.data?.data))
        .catch(() => navigate('/explore'))
        .finally(() => setLoading(false));
  }, [id, navigate]);

  const totalCost = trip ? trip.pricePerPerson * count : 0;

  const onBook = async (data) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBooking(true);
    try {
      const res = await bookingService.create({
        predefinedTripId: trip.id,
        participantCount: Number(data.participantCount),
        travelDate: data.travelDate,
      });
      const order = res.data?.data;
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onerror = () => toast.error('Failed to load payment interface');
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount * 100,
          currency: order.currency,
          order_id: order.razorpayOrderId,
          name: 'TripPlanner',
          description: trip.title,
          handler: async (response) => {
            try {
              await import('../services').then(({ paymentService }) =>
                  paymentService.verify({
                    bookingId: order.bookingId,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  })
              );
              toast.success('Booking confirmed! 🎉');
              navigate('/bookings');
            } catch { toast.error('Payment verification failed'); }
          },
          prefill: { name: '', email: '' },
          theme: { color: '#6c63ff' },
        });
        rzp.open();
      };
    } catch { toast.error('Failed to initiate booking'); }
    setBooking(false);
  };

  if (loading) return <PageLoader />;
  if (!trip) return null;

  const color = CAT_COLORS[trip.category] || '#6c63ff';
  const heroImageUrl = getPrimaryImageUrl(trip);

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom:80 }}>

          {/* Back */}
          <button onClick={() => navigate(-1)} className="btn btn-ghost"
                  style={{ marginTop:20, marginBottom:28, paddingLeft:0 }}>
            <ArrowLeft size={16} /> Back to Explore
          </button>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px',
            gap:32, alignItems:'start' }}>

            {/* LEFT */}
            <div>
              {/* Hero image */}
              <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
                          style={{ height:380, borderRadius:'var(--radius-xl)',
                            background:`linear-gradient(135deg,${color}30,${color}10)`,
                            overflow:'hidden', marginBottom:32, position:'relative',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                {heroImageUrl
                    ? <img src={heroImageUrl} alt={trip.title}
                           style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <MapPin size={64} color={color} opacity={0.3} />
                }
                <div style={{ position:'absolute', inset:0,
                  background:'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                <div style={{ position:'absolute', bottom:24, left:24 }}>
                <span className="badge" style={{ background:`${color}33`, color,
                  backdropFilter:'blur(10px)', fontSize:'0.8rem' }}>
                  {trip.category}
                </span>
                </div>
              </motion.div>

              {/* Info */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                          transition={{ delay:0.1 }}>
                <h1 style={{ fontSize:'2rem', marginBottom:12 }}>{trip.title}</h1>

                {/* Meta chips */}
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:20 }}>
                  {[
                    { icon: Clock,    text: `${trip.durationDays} Days` },
                    { icon: Train,    text: trip.transportMode || 'Mixed' },
                    { icon: Calendar, text: trip.bestSeason || 'All seasons' },
                    { icon: Star,     text: '4.8 Rating', color:'var(--accent-amber)' },
                  ].map(({ icon: Icon, text, color: c }) => (
                      <div key={text} style={{ display:'flex', alignItems:'center', gap:6,
                        color: c || 'var(--text-secondary)', fontSize:'0.9rem' }}>
                        <Icon size={15} /> {text}
                      </div>
                  ))}
                </div>

                <p style={{ fontSize:'1rem', lineHeight:1.8, marginBottom:32,
                  color:'var(--text-secondary)' }}>
                  {trip.description}
                </p>

                {/* Destinations */}
                {trip.destinations?.length > 0 && (
                    <div style={{ marginBottom:32 }}>
                      <h3 style={{ fontSize:'1.1rem', marginBottom:16 }}>
                        📍 Destinations Covered
                      </h3>
                      <div style={{ display:'grid',
                        gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                        {trip.destinations.map(dest => (
                            <div key={dest.id} style={{
                              background:'var(--bg-card)', border:'1px solid var(--border)',
                              borderRadius:'var(--radius-md)', padding:'14px 16px' }}>
                              {getPrimaryImageUrl(dest) && (
                                  <img src={getPrimaryImageUrl(dest)} alt={dest.name}
                                       style={{ width:'100%', height:110, objectFit:'cover',
                                         borderRadius:'var(--radius-sm)', marginBottom:12 }} />
                              )}
                              <div style={{ fontWeight:600, fontSize:'0.95rem',
                                marginBottom:4 }}>{dest.name}</div>
                              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)',
                                display:'flex', gap:8, alignItems:'center' }}>
                                <Tag size={11} />
                                {dest.category}
                                {dest.state && ` · ${dest.state}`}
                              </div>
                              <div style={{ fontSize:'0.82rem', color:'var(--accent-green)',
                                marginTop:6, fontWeight:500 }}>
                                ~₹{dest.avgCostPerPerson?.toLocaleString('en-IN')}/person
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* Inclusions */}
                <div style={{ marginBottom:32 }}>
                  <h3 style={{ fontSize:'1.1rem', marginBottom:16 }}>✅ What's Included</h3>
                  <div style={{ display:'grid',
                    gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                    {['Accommodation','Transport','Guided tours','Breakfast',
                      'Emergency support','Travel insurance'].map(item => (
                        <div key={item} style={{ display:'flex', alignItems:'center', gap:8,
                          fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                          <CheckCircle size={15} color="var(--accent-green)" /> {item}
                        </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT — Booking Card */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay:0.2 }}
                        style={{ position:'sticky', top:100 }}>
              <div className="glass-card" style={{ padding:28 }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)',
                    textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    Starting from
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'2.2rem',
                    fontWeight:700, lineHeight:1.1, color:'var(--text-primary)' }}>
                    ₹{trip.pricePerPerson?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>per person</div>
                </div>

                <form onSubmit={handleSubmit(onBook)}
                      style={{ display:'flex', flexDirection:'column', gap:16 }}>

                  <div className="input-group">
                    <label className="input-label">Travel Date</label>
                    <input type="date" className={`input-field ${errors.travelDate?'error':''}`}
                           min={new Date().toISOString().split('T')[0]}
                           {...register('travelDate', { required:'Travel date is required' })} />
                    {errors.travelDate &&
                        <span className="input-error">{errors.travelDate.message}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <Users size={13} style={{ display:'inline', marginRight:4 }} />
                      Travelers
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <button type="button" className="btn btn-outline btn-sm"
                              style={{ width:36, height:36, padding:0, justifyContent:'center' }}
                              onClick={() => {
                                setValue('participantCount', Math.max(1, count - 1), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }}>−</button>
                      <input id="pcount" type="number" className="input-field"
                             style={{ textAlign:'center', flex:1 }} min={1} max={30}
                             {...register('participantCount', { required:true, min:1, valueAsNumber:true })} />
                      <button type="button" className="btn btn-outline btn-sm"
                              style={{ width:36, height:36, padding:0, justifyContent:'center' }}
                              onClick={() => {
                                setValue('participantCount', Math.min(30, count + 1), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }}>+</button>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ background:'var(--bg-secondary)',
                    borderRadius:'var(--radius-md)', padding:'14px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                    Total ({count} person{count > 1 ? 's':''})
                  </span>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:700,
                      fontSize:'1.3rem', color: `${color}` }}>
                    ₹{(trip.pricePerPerson * count)?.toLocaleString('en-IN')}
                  </span>
                  </div>

                  <button type="submit" className="btn btn-primary"
                          style={{ width:'100%', justifyContent:'center' }}
                          disabled={booking}>
                    {booking ? <span className="spinner" /> : '🎒 Book This Trip'}
                  </button>
                </form>

                <div style={{ marginTop:16, fontSize:'0.8rem', color:'var(--text-muted)',
                  textAlign:'center', display:'flex', gap:8, justifyContent:'center',
                  flexWrap:'wrap' }}>
                  <span>🔒 Secure payment</span>
                  <span>·</span>
                  <span>✅ Free cancellation</span>
                  <span>·</span>
                  <span>📞 24/7 support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <style>{`
        @media (max-width:768px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
      </div>
  );
}

function PageLoader() {
  return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center',
        justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" style={{ width:40, height:40, margin:'0 auto 16px',
            borderWidth:3 }} />
          <p>Loading trip details...</p>
        </div>
      </div>
  );
}
