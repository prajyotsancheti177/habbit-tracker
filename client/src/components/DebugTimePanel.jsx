import { useState, useEffect } from 'react';
import './DebugTimePanel.css';

function DebugTimePanel() {
    const [enabled, setEnabled] = useState(false);
    const [mockDate, setMockDate] = useState('');
    const [mockTime, setMockTime] = useState('12:00');

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('debugMockTime');
        if (saved) {
            const parsed = JSON.parse(saved);
            setEnabled(parsed.enabled);
            setMockDate(parsed.date || '');
            setMockTime(parsed.time || '12:00');
        }
    }, []);

    useEffect(() => {
        // Save to localStorage & set global
        const mockDateTime = enabled && mockDate
            ? new Date(`${mockDate}T${mockTime}:00`).toISOString()
            : null;

        localStorage.setItem('debugMockTime', JSON.stringify({
            enabled,
            date: mockDate,
            time: mockTime,
            isoString: mockDateTime
        }));

        // Set global for API calls
        window.__DEBUG_MOCK_TIME__ = mockDateTime;
    }, [enabled, mockDate, mockTime]);

    const presets = [
        { label: 'Now', action: () => { setEnabled(false); } },
        {
            label: 'Tomorrow', action: () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setMockDate(tomorrow.toISOString().split('T')[0]);
                setEnabled(true);
            }
        },
        {
            label: '+1 Week', action: () => {
                const future = new Date();
                future.setDate(future.getDate() + 7);
                setMockDate(future.toISOString().split('T')[0]);
                setEnabled(true);
            }
        },
        {
            label: 'Next Month', action: () => {
                const future = new Date();
                future.setMonth(future.getMonth() + 1);
                setMockDate(future.toISOString().split('T')[0]);
                setEnabled(true);
            }
        },
    ];

    return (
        <div className={`debug-panel ${enabled ? 'debug-panel--active' : ''}`}>
            <div className="debug-panel__header">
                <span>🕐 Debug Time</span>
                <label className="debug-toggle">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                    />
                    <span className="debug-toggle__slider"></span>
                </label>
            </div>

            {enabled && (
                <div className="debug-panel__content">
                    <div className="debug-panel__inputs">
                        <input
                            type="date"
                            value={mockDate}
                            onChange={(e) => setMockDate(e.target.value)}
                        />
                        <input
                            type="time"
                            value={mockTime}
                            onChange={(e) => setMockTime(e.target.value)}
                        />
                    </div>

                    <div className="debug-panel__presets">
                        {presets.map(p => (
                            <button key={p.label} onClick={p.action}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {mockDate && (
                        <div className="debug-panel__current">
                            Mock: {new Date(`${mockDate}T${mockTime}:00`).toLocaleString()}
                        </div>
                    )}

                    <div className="debug-panel__hint">
                        ⚠️ Refresh page after changing time
                    </div>
                </div>
            )}
        </div>
    );
}

export default DebugTimePanel;
