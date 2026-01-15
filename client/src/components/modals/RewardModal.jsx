import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import '../modals/HabitModal.css'; // Reusing habit modal styles for consistency

function RewardModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cost: 100,
        icon: '🎁',
        color: '#10b981'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            title: '',
            description: '',
            cost: 100,
            icon: '🎁',
            color: '#10b981'
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Reward" size="md">
            <form onSubmit={handleSubmit} className="habit-form">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Cheat Day"
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="What do you get?"
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Cost (Coins)</label>
                        <input
                            type="number"
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Icon</label>
                        <input
                            type="text"
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            placeholder="e.g. 🍕"
                            className="emoji-input"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Create Reward
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default RewardModal;
