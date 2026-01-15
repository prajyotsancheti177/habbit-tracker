import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HabitsPage from './pages/HabitsPage';
import TasksPage from './pages/TasksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RewardsPage from './pages/RewardsPage';
import HistoryPage from './pages/HistoryPage';

function App() {
    return (
        <AppProvider>
            <Router>
                <div className="app-wrapper">
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/habits" element={<HabitsPage />} />
                            <Route path="/tasks" element={<TasksPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/rewards" element={<RewardsPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                        </Routes>
                    </Layout>
                </div>
            </Router>
        </AppProvider>
    );
}

export default App;
