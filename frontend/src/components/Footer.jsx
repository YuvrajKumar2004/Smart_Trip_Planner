import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Globe, Camera, Send, Heart } from 'lucide-react';

const LINKS = {
    Product:  [['Explore Trips','/explore'],['My Trips','/trips'],
        ['Recommendations','/recommend'],['Bookings','/bookings']],
    Company:  [['About Us','#'],['Blog','#'],['Careers','#'],['Press','#']],
    Support:  [['Help Center','#'],['Privacy Policy','#'],
        ['Terms of Service','#'],['Contact Us','#']],
};

export default function Footer() {
    return (
        <footer style={{ background:'var(--bg-secondary)',
            borderTop:'1px solid var(--divider)', paddingTop:60, paddingBottom:32 }}>
            <div className="container">
                <div style={{ display:'grid',
                    gridTemplateColumns:'2fr repeat(3,1fr)', gap:40, marginBottom:48 }}>

                    {/* Brand */}
                    <div>
                        <Link to="/" style={{ display:'flex', alignItems:'center',
                            gap:10, marginBottom:16 }}>
                            <div style={{ width:36, height:36, borderRadius:10,
                                background:'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:'0 0 16px var(--accent-glow)' }}>
                                <Map size={18} color="#fff" />
                            </div>
                            <span style={{ fontFamily:'var(--font-display)', fontWeight:700,
                                fontSize:'1.2rem' }}>
                Trip<span className="gradient-text">Planner</span>
              </span>
                        </Link>
                        <p style={{ fontSize:'0.88rem', lineHeight:1.7, maxWidth:280,
                            color:'var(--text-muted)', marginBottom:20 }}>
                            The all-in-one platform for planning trips, splitting expenses,
                            and creating memories with people you love.
                        </p>
                        <div style={{ display:'flex', gap:10 }}>
                            {[
                                { icon:Send,   href:'#' },
                                { icon:Camera, href:'#' },
                                { icon:Globe,  href:'#' },
                            ].map(({ icon:Icon, href }) => (
                                <a key={href} href={href}
                                   style={{ width:36, height:36, borderRadius:'var(--radius-md)',
                                       background:'var(--bg-card)', border:'1px solid var(--border)',
                                       display:'flex', alignItems:'center', justifyContent:'center',
                                       color:'var(--text-muted)', transition:'all 0.2s' }}
                                   onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                       e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                   onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';
                                       e.currentTarget.style.color = 'var(--text-muted)'; }}>
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(LINKS).map(([section, links]) => (
                        <div key={section}>
                            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-primary)',
                                letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>
                                {section}
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                {links.map(([label, href]) => (
                                    <Link key={label} to={href}
                                          style={{ fontSize:'0.88rem', color:'var(--text-muted)',
                                              transition:'color 0.15s' }}
                                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div style={{ borderTop:'1px solid var(--divider)', paddingTop:24,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    flexWrap:'wrap', gap:12 }}>
                    <p style={{ fontSize:'0.83rem', color:'var(--text-muted)', margin:0 }}>
                        © {new Date().getFullYear()} TripPlanner. All rights reserved.
                    </p>
                    <p style={{ fontSize:'0.83rem', color:'var(--text-muted)', margin:0,
                        display:'flex', alignItems:'center', gap:5 }}>
                        Built with <Heart size={13} color="var(--accent-secondary)"
                                          fill="var(--accent-secondary)" /> for travelers
                    </p>
                </div>
            </div>

            <style>{`
        @media (max-width:768px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
        </footer>
    );
}
