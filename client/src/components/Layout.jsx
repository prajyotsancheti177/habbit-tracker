import { useState } from 'react';
import Sidebar from './Sidebar';
import DebugTimePanel from './DebugTimePanel';
import './Layout.css';

function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <header className="layout__header">
                <button
                    className="layout__menu-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </header>

            <main className="layout__main">
                {children}
            </main>

            {/* Debug panel for testing time-based features */}
            <DebugTimePanel />
        </div>
    );
}

export default Layout;
