import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

function Toast({ message, action, actionLabel, duration = 5000, onClose, type = 'info' }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, handleClose]);

    const handleAction = () => {
        action?.();
        handleClose();
    };

    if (!isVisible) return null;

    return (
        <div className={`toast toast--${type} ${isLeaving ? 'toast--leaving' : ''}`}>
            <span className="toast__message">{message}</span>
            {action && actionLabel && (
                <button className="toast__action" onClick={handleAction}>
                    {actionLabel}
                </button>
            )}
            <button className="toast__close" onClick={handleClose}>✕</button>
        </div>
    );
}

// Toast container for managing multiple toasts
export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

export default Toast;
