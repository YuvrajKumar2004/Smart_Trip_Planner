import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertCircle, CreditCard, CheckCircle, Zap } from 'lucide-react';
import { formatINR } from '../utils/helpers';

const metrics = [
  { label: 'Upcoming trips', value: '04', icon: TrendingUp, color: '#6c63ff' },
  { label: 'Pending approvals', value: '02', icon: Clock, color: '#ff9f7f' },
  { label: 'Wallet exposure', value: formatINR(56240), icon: CreditCard, color: '#ff6584' },
  { label: 'Open balances', value: formatINR(18750), icon: AlertCircle, color: '#43e97b' },
];

const actions = [
  { task: 'Confirm Manali hotel inventory', status: 'Pending', statusColor: '#f9c74f' },
  { task: 'Collect flight details from group members', status: 'In progress', statusColor: '#00d2ff' },
  { task: 'Finalize split for last Ladakh trip', status: 'Ready', statusColor: '#43e97b' },
];

function TravelDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="page">
      <div className="container">
        {/* Header */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="tag-badge">
              <Zap size={13} fill="currentColor" />
              Travel Dashboard
            </span>
            <h1 className="dashboard-title">Your Travel Hub</h1>
            <p className="dashboard-subtitle">
              Get a complete overview of your trips, pending actions, and financial status
            </p>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          className="metrics-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.label}
                className="metric-card"
                variants={itemVariants}
                style={{ '--metric-color': item.color }}
              >
                <div className="metric-icon">
                  <Icon size={24} color={item.color} />
                </div>
                <span className="metric-label">{item.label}</span>
                <p className="metric-value">{item.value}</p>
                <div className="metric-accent" style={{ background: item.color }} />
              </motion.article>
            );
          })}
        </motion.div>

        {/* Content Grid */}
        <motion.div
          className="content-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Priority Actions */}
          <motion.article className="dashboard-card" variants={itemVariants}>
            <div className="card-header">
              <h2 className="card-title">Priority Actions</h2>
              <span className="action-badge">{actions.length}</span>
            </div>
            <div className="actions-list">
              {actions.map((item, idx) => (
                <div key={idx} className="action-item">
                  <div className="action-left">
                    <CheckCircle size={16} color={item.statusColor} opacity={0.6} />
                    <span className="action-text">{item.task}</span>
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: `${item.statusColor}20`, color: item.statusColor }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.article>

          {/* Recent Activity */}
          <motion.article className="dashboard-card" variants={itemVariants}>
            <div className="card-header">
              <h2 className="card-title">Recent Activity</h2>
            </div>
            <div className="activity-placeholder">
              <div className="placeholder-icon">📊</div>
              <p className="placeholder-text">Your recent bookings and transactions appear here</p>
              <p className="placeholder-hint">Backend updates will populate real-time activity</p>
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
}

export default TravelDashboard;
