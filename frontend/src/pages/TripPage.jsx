import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, MapPin, Wallet,
    Edit2, Trash2, UserPlus, UserMinus, ChevronRight } from 'lucide-react';
import { userTripService } from '../services';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { formatINR, formatDate, STATUS_COLORS, getPrimaryImageUrl } from '../utils/helpers';

const unwrapData = (responseData) => responseData?.data ?? responseData;

export default function TripPage() {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { user }        = useAuthStore();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const load = () => {
        userTripService.getOne(id)
            .then(res => setTrip(unwrapData(res.data)))
            .catch(() => navigate('/trips'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Delete this trip? This cannot be undone.')) return;
        try {
            await userTripService.delete(id);
            toast.success('Trip deleted');
            navigate('/trips');
        } catch { toast.error('Failed to delete trip'); }
    };

    const handleStatusChange = async (status) => {
        try {
            await userTripService.updateStatus(id, { status });
            toast.success(`Status â†’ ${status}`);
            load();
        } catch { toast.error('Failed to update status'); }
    };

    const isCreator = trip?.createdBy === user?.name;
    const color = STATUS_COLORS[trip?.status] || '#6c63ff';

    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
    );

    if (!trip) return null;

    return (
        <div className="page page-enter">
            <div className="container" style={{ paddingBottom: 80 }}>

                <button onClick={() => navigate('/trips')} className="btn btn-ghost"
                        style={{ marginTop: 20, marginBottom: 28, paddingLeft: 0 }}>
                    <ArrowLeft size={16} /> My Trips
                </button>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <h2 style={{ fontSize: '1.8rem' }}>{trip.title}</h2>
                            <span className="badge" style={{ background: `${color}18`, color }}>
                {trip.status}
              </span>
                        </div>
                        <p>{trip.description || 'No description provided'}</p>
                    </div>

                    {isCreator && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            {trip.status === 'PLANNING' && (
                                <button className="btn btn-sm"
                                        style={{ background: 'rgba(67,233,123,0.12)',
                                            color: 'var(--accent-green)',
                                            border: '1px solid rgba(67,233,123,0.2)' }}
                                        onClick={() => handleStatusChange('ONGOING')}>
                                    Start Trip
                                </button>
                            )}
                            {trip.status === 'ONGOING' && (
                                <button className="btn btn-sm"
                                        style={{ background: 'rgba(67,233,123,0.12)',
                                            color: 'var(--accent-green)',
                                            border: '1px solid rgba(67,233,123,0.2)' }}
                                        onClick={() => handleStatusChange('COMPLETED')}>
                                    Complete
                                </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px',
                    gap: 24, alignItems: 'start' }}>

                    {/* LEFT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Trip info card */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: 18 }}>Trip Details</h3>
                            <div style={{ display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
                                {[
                                    { icon: Calendar, label: 'Start', value: formatDate(trip.startDate) },
                                    { icon: Calendar, label: 'End',   value: formatDate(trip.endDate) },
                                    { icon: Users,    label: 'Travelers', value: trip.numberOfTravelers },
                                    { icon: MapPin,   label: 'Type',  value: trip.tripType },
                                    { icon: Wallet,   label: 'Min Budget', value: formatINR(trip.minBudget) },
                                    { icon: Wallet,   label: 'Max Budget', value: formatINR(trip.maxBudget) },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} style={{ background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                                            fontSize: '0.75rem', color: 'var(--text-muted)',
                                            marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Icon size={11} /> {label}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Destinations */}
                        {trip.destinations?.length > 0 && (
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>ðŸ“ Destinations</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {trip.destinations.map(d => (
                                        <div key={d.id} style={{ display: 'flex', alignItems: 'center',
                                            gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)' }}>
                                            {getPrimaryImageUrl(d) ? (
                                                <img src={getPrimaryImageUrl(d)} alt={d.name}
                                                     style={{ width: 44, height: 44, objectFit: 'cover',
                                                         borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                                            ) : (
                                                <MapPin size={14} color="var(--accent-primary)" />
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {d.state} Â· {d.category}
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: 'auto', fontSize: '0.85rem',
                                                color: 'var(--accent-green)', fontWeight: 600 }}>
                                                ~{formatINR(d.avgCostPerPerson)}/person
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expenses quick link */}
                        <Link to={`/trips/${id}/expenses`} style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: 20, display: 'flex',
                                alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(108,99,255,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Wallet size={20} color="var(--accent-primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Expenses & Settlements</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Track group spending and settle debts
                                    </div>
                                </div>
                                <ChevronRight size={18} color="var(--text-muted)" />
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT: Members */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>
                            ðŸ‘¥ Members ({trip.members?.length || 1})
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {/* Creator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', background: 'rgba(108,99,255,0.08)',
                                borderRadius: 'var(--radius-md)', border: '1px solid rgba(108,99,255,0.2)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%',
                                    background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>
                                    {trip.createdBy?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{trip.createdBy}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>Creator</div>
                                </div>
                            </div>

                            {/* Other members */}
                            {trip.members?.filter(m => m.name !== trip.createdBy).map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%',
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                        {m.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                                    </div>
                                    {isCreator && (
                                        <button className="btn btn-danger btn-icon"
                                                style={{ padding: 6 }}
                                                onClick={async () => {
                                                    try {
                                                        await userTripService.removeMember(id, m.id);
                                                        toast.success('Member removed');
                                                        load();
                                                    } catch { toast.error('Failed to remove member'); }
                                                }}>
                                            <UserMinus size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add member by email */}
                         {isCreator && (
                             <div>
                                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)',
                                     marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                     Add member by email
                                 </div>
                                 <div style={{ display: 'flex', gap: 8 }}>
                                     <input
                                         type="email"
                                         className="input-field"
                                         placeholder="Enter email address"
                                         value={newMemberEmail}
                                         onChange={e => setNewMemberEmail(e.target.value)}
                                         style={{ flex: 1 }}
                                     />
                                     <button className="btn btn-primary btn-sm"
                                             onClick={async () => {
                                                 if (!newMemberEmail) return;
                                                 try {
                                                     await userTripService.addMember(id, { email: newMemberEmail });
                                                     toast.success('Member added');
                                                     setNewMemberEmail('');
                                                     load();
                                                 } catch (err) {
                                                     toast.error(err?.message || 'Failed to add member');
                                                 }
                                             }}>
                                         <UserPlus size={14} />
                                     </button>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </div>
    );
}
