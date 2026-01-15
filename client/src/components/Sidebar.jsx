import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/habits', icon: '🎯', label: 'Habits' },
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/analytics', icon: '📊', label: 'Analytics' },
    { path: '/history', icon: '📅', label: 'History' },
    { path: '/rewards', icon: '🪙', label: 'Rewards' },
];

function Sidebar({ isOpen, onToggle }) {
    const location = useLocation();
    const { coins } = useApp();

    return (
        <>
            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <span className="sidebar__logo-icon">✓</span>
                        <span className="sidebar__logo-text">Habit Tracker</span>
                    </div>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            <span className="sidebar__link-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    <div className="sidebar__coins">
                        <span className="sidebar__coins-icon">🪙</span>
                        <span className="sidebar__coins-value">{coins.toLocaleString()}</span>
                        <span className="sidebar__coins-label">Coins</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && <div className="sidebar__overlay" onClick={onToggle} />}
        </>
    );
}

export default Sidebar;
