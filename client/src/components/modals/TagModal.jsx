import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import './TagModal.css';

const defaultColors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
];

const defaultIcons = ['🏷️', '🎯', '💼', '🏠', '💡', '🔧', '📊', '🎨', '🚀', '⭐', '💰', '🎓'];

function TagModal({ isOpen, onClose }) {
    const { tags, fetchTags, createTag, updateTag, deleteTag } = useApp();
    const [editingTag, setEditingTag] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#3b82f6',
        icon: '🏷️',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen, fetchTags]);

    useEffect(() => {
        if (editingTag) {
            setFormData({
                name: editingTag.name,
                color: editingTag.color,
                icon: editingTag.icon,
                description: editingTag.description || ''
            });
        } else {
            setFormData({
                name: '',
                color: '#3b82f6',
                icon: '🏷️',
                description: ''
            });
        }
    }, [editingTag]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTag) {
                await updateTag(editingTag._id, formData);
            } else {
                await createTag(formData);
            }
            setEditingTag(null);
            setFormData({ name: '', color: '#3b82f6', icon: '🏷️', description: '' });
        } catch (error) {
            console.error('Failed to save tag:', error);
        }
    };

    const handleDelete = async (tagId) => {
        if (window.confirm('Delete this tag? It will be removed from all habits and tasks.')) {
            try {
                await deleteTag(tagId);
            } catch (error) {
                console.error('Failed to delete tag:', error);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags" size="lg">
            <div className="tag-modal">
                {/* Tag List */}
                <div className="tag-list">
                    <h3>Your Tags</h3>
                    {tags.length > 0 ? (
                        <div className="tag-items">
                            {tags.map(tag => (
                                <div
                                    key={tag._id}
                                    className={`tag-item ${editingTag?._id === tag._id ? 'tag-item--editing' : ''}`}
                                >
                                    <span
                                        className="tag-item__preview"
                                        style={{ '--tag-color': tag.color }}
                                    >
                                        {tag.icon} {tag.name}
                                    </span>
                                    <div className="tag-item__actions">
                                        <button onClick={() => setEditingTag(tag)}>✏️</button>
                                        <button onClick={() => handleDelete(tag._id)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-text">No tags yet. Create your first one!</p>
                    )}
                </div>

                {/* Tag Form */}
                <form onSubmit={handleSubmit} className="tag-form">
                    <h3>{editingTag ? 'Edit Tag' : 'New Tag'}</h3>

                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Work, Personal, Health"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-selector">
                            {defaultColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-btn ${formData.color === color ? 'color-btn--active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Icon</label>
                        <div className="icon-selector">
                            {defaultIcons.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    className={`icon-btn ${formData.icon === icon ? 'icon-btn--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="form-actions">
                        {editingTag && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setEditingTag(null)}
                            >
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary">
                            {editingTag ? 'Save Changes' : 'Create Tag'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

export default TagModal;
