import { useEffect } from 'react';
import './Modal.css';

function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal modal--${size}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    {showClose && (
                        <button className="modal__close" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    )}
                </div>
                <div className="modal__body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
