import { useEffect, useState, useCallback } from 'react';
import { rewardsApi } from '../api';
import GlassCard from '../components/ui/GlassCard';
import RewardModal from '../components/modals/RewardModal';
import { ToastContainer } from '../components/ui/Toast';
import './RewardsPage.css';

function RewardsPage() {
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Toast management
    const addToast = useCallback((toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, itemsRes, historyRes] = await Promise.all([
                rewardsApi.getProfile(),
                rewardsApi.getItems(),
                rewardsApi.getHistory({ page, limit: 20 })
            ]);
            setProfile(profileRes.data);
            setItems(itemsRes.data);
            setHistory(historyRes.data.history);
            setTotalPages(historyRes.data.totalPages);
        } catch (error) {
            console.error('Failed to load rewards:', error);
            addToast({ message: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateReward = async (data) => {
        try {
            await rewardsApi.createItem(data);
            addToast({ message: 'Reward created successfully!', type: 'success' });
            loadData(); // Refresh list
        } catch (error) {
            console.error('Failed to create reward:', error);
            addToast({ message: 'Failed to create reward', type: 'error' });
        }
    };

    const handleRedeem = async (item) => {
        if (!profile || profile.coins < item.cost) {
            addToast({ message: 'Insufficient coins!', type: 'error' });
            return;
        }

        if (!window.confirm(`Are you sure you want to redeem "${item.title}" for ${item.cost} coins?`)) {
            return;
        }

        try {
            const response = await rewardsApi.redeemItem(item._id);
            // Update local state immediately
            setProfile(prev => ({ ...prev, coins: response.data.newBalance }));
            setHistory(prev => [
                {
                    itemTitle: item.title,
                    itemType: 'reward',
                    completionType: 'redemption',
                    coinsEarned: -item.cost,
                    completedAt: new Date().toISOString()
                },
                ...prev
            ]);
            addToast({
                message: `🎉 Redeemed "${item.title}"! Enjoy!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to redeem:', error);
            addToast({ message: 'Redemption failed', type: 'error' });
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this reward?')) return;

        try {
            await rewardsApi.deleteItem(id);
            setItems(prev => prev.filter(i => i._id !== id));
            addToast({ message: 'Reward deleted', type: 'info' });
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !profile) {
        return (
            <div className="page-container">
                <div className="skeleton" style={{ height: '200px', marginBottom: '24px' }} />
                <div className="skeleton" style={{ height: '400px' }} />
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">
                    🪙 <span className="text-gradient">Rewards</span>
                </h1>
                <p className="page-subtitle">
                    Marketplace & History
                </p>
            </header>

            {/* Coins Balance Card */}
            <GlassCard className="balance-card" glow glowColor="orange">
                <div className="balance-card__content">
                    <div className="balance-card__main">
                        <span className="balance-card__label">Current Balance</span>
                        <div className="balance-card__amount">
                            <span className="balance-card__icon">🪙</span>
                            <span className="balance-card__value">
                                {profile?.coins?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                    <div className="balance-card__stats">
                        <div className="balance-stat">
                            <span className="balance-stat__value">
                                {profile?.totalCoinsEarned?.toLocaleString() || 0}
                            </span>
                            <span className="balance-stat__label">Total Earned</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Marketplace Section */}
            <div className="marketplace-section">
                <div className="section-header">
                    <h2>🛒 Marketplace</h2>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        + New Reward
                    </button>
                </div>

                <div className="rewards-grid">
                    {items.map(item => (
                        <GlassCard key={item._id} className="reward-card" hover>
                            <div className="reward-card__icon">{item.icon}</div>
                            <div className="reward-card__content">
                                <h3 className="reward-card__title">{item.title}</h3>
                                <p className="reward-card__desc">{item.description}</p>
                                <div className="reward-card__footer">
                                    <span className="reward-card__cost">🪙 {item.cost}</span>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleRedeem(item)}
                                        disabled={profile?.coins < item.cost}
                                    >
                                        Redeem
                                    </button>
                                </div>
                            </div>
                            <button
                                className="reward-card__delete"
                                onClick={(e) => handleDelete(item._id, e)}
                                title="Delete Reward"
                            >
                                ✕
                            </button>
                        </GlassCard>
                    ))}

                    {items.length === 0 && (
                        <div className="empty-state-card">
                            <span>🛍️</span>
                            <p>No rewards yet. Create one!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction History */}
            <GlassCard className="history-card">
                <h2 className="history-title">Transaction History</h2>

                {history.length > 0 ? (
                    <>
                        <div className="history-list">
                            {history.map((item, index) => {
                                const isRedemption = item.coinsEarned < 0 || item.completionType === 'redemption';
                                return (
                                    <div key={index} className={`history-item ${isRedemption ? 'history-item--redemption' : ''}`}>
                                        <div className="history-item__icon">
                                            {item.itemType === 'reward' ? '🎁' : (item.itemType === 'habit' ? '🎯' : '📋')}
                                        </div>
                                        <div className="history-item__info">
                                            <span className="history-item__title">{item.itemTitle}</span>
                                            <span className="history-item__type">
                                                {isRedemption ? 'Reward Redeemed' : `${item.itemType === 'habit' ? 'Habit' : 'Task'} completed`}
                                            </span>
                                        </div>
                                        <div className="history-item__meta">
                                            <span className={`history-item__coins ${isRedemption ? 'text-red' : 'text-green'}`}>
                                                {item.coinsEarned > 0 ? '+' : ''}{item.coinsEarned} 🪙
                                            </span>
                                            <span className="history-item__date">
                                                {formatDate(item.completedAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-secondary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </button>
                                <span className="pagination__info">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🪙</div>
                        <h3 className="empty-state-title">No transactions yet</h3>
                        <p className="empty-state-text">
                            Complete habits and tasks to start earning coins!
                        </p>
                    </div>
                )}
            </GlassCard>

            <RewardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateReward}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default RewardsPage;
