import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, CreditCard, MapPin, XCircle } from 'lucide-react';
import { bookingService } from '../services';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  CONFIRMED: { color:'#43e97b', bg:'rgba(67,233,123,0.12)', label:'Confirmed' },
  PENDING:   { color:'#f9c74f', bg:'rgba(249,199,79,0.12)',  label:'Pending'   },
  CANCELLED: { color:'#ff6b6b', bg:'rgba(255,107,107,0.12)', label:'Cancelled' },
  FAILED:    { color:'#9898b3', bg:'rgba(152,152,179,0.12)', label:'Failed'    },
};

const unwrapPage = (responseData) => {
  const pageData = responseData?.data ?? responseData;
  return {
    content: Array.isArray(pageData?.content) ? pageData.content : [],
    totalPages: Number.isFinite(Number(pageData?.totalPages)) ? Number(pageData.totalPages) : 0,
  };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchBookings = async (p = 0) => {
    setLoading(true);
    try {
      const res = await bookingService.getHistory({ page:p, size:8 });
      const bookingPage = unwrapPage(res.data);
      setBookings(bookingPage.content);
      setTotalPages(bookingPage.totalPages);
    } catch (_) {
      toast.error('Failed to load bookings');
      setBookings([]);
      setTotalPages(0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? A refund will be initiated.')) return;
    try {
      const res = await bookingService.cancel(id, {});
      toast.success(res.data?.message || 'Booking cancelled');
      fetchBookings(page);
    } catch (_) { toast.error('Failed to cancel booking'); }
  };

  return (
      <div className="page page-enter">
        <div className="container" style={{ paddingBottom:80 }}>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      style={{ paddingTop:20, marginBottom:36 }}>
            <h2 style={{ marginBottom:6 }}>My <span className="gradient-text">Bookings</span></h2>
            <p>Track all your trip bookings and payment history</p>
          </motion.div>

          {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {Array(4).fill(0).map((_,i) => <BookingSkeleton key={i} />)}
              </div>
          ) : bookings.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ fontSize:'4rem', marginBottom:16 }}>🎫</div>
                <h3 style={{ marginBottom:8 }}>No bookings yet</h3>
                <p style={{ marginBottom:24 }}>Browse destinations and book your first trip!</p>
                <a href="/explore" className="btn btn-primary">Explore Trips</a>
              </div>
          ) : (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {bookings.map((booking, i) => {
                    const cfg = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.PENDING;
                    return (
                        <motion.div key={booking.bookingId}
                                    initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                                    transition={{ delay:i*0.05 }}
                                    style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                                      borderRadius:'var(--radius-lg)', padding:'20px 24px',
                                      display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>

                          {/* Status dot */}
                          <div style={{ width:52, height:52, borderRadius:14,
                            background:`${cfg.color}18`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            flexShrink:0 }}>
                            <CreditCard size={22} color={cfg.color} />
                          </div>

                          <div style={{ flex:1, minWidth:200 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10,
                              marginBottom:6 }}>
                              <h3 style={{ fontSize:'1rem', fontWeight:600 }}>
                                {booking.tripTitle}
                              </h3>
                              <span className="badge" style={{ background:cfg.bg,
                                color:cfg.color, fontSize:'0.7rem' }}>
                          {cfg.label}
                        </span>
                            </div>
                            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                              {[
                                { icon: Calendar, text: booking.travelDate },
                                { icon: Users,    text: `${booking.participantCount} travelers` },
                                { icon: MapPin,   text: `Booking #${booking.bookingId}` },
                              ].map(({ icon:Icon, text }) => (
                                  <span key={text} style={{ display:'flex', alignItems:'center',
                                    gap:5, fontSize:'0.82rem', color:'var(--text-muted)' }}>
                            <Icon size={12} /> {text}
                          </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem',
                              fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
                              ₹{booking.totalAmount?.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)',
                              marginBottom:10 }}>
                              {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                            </div>
                            {booking.bookingStatus === 'CONFIRMED' && (
                                <button className="btn btn-danger btn-sm"
                                        onClick={() => handleCancel(booking.bookingId)}>
                                  <XCircle size={13} /> Cancel
                                </button>
                            )}
                          </div>
                        </motion.div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:36 }}>
                      {Array.from({ length:totalPages }, (_,i) => (
                          <button key={i} onClick={() => { setPage(i); fetchBookings(i); }}
                                  className="btn btn-sm"
                                  style={{ minWidth:36,
                                    background: page===i ? 'var(--accent-primary)' : 'var(--bg-card)',
                                    color: page===i ? '#fff' : 'var(--text-secondary)',
                                    border:`1px solid ${page===i ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                            {i+1}
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

function BookingSkeleton() {
  return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', padding:'20px 24px',
        display:'flex', gap:20, alignItems:'center' }}>
        <div style={{ width:52, height:52, borderRadius:14,
          background:'var(--bg-secondary)', flexShrink:0,
          animation:'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          {[60,80,50].map((w,i) => (
              <div key={i} style={{ height:13, borderRadius:6, background:'var(--bg-secondary)',
                width:`${w}%`, animation:'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
  );
}
