"use client";

import { useEffect } from 'react';
import { useDataStore } from '@/lib/store/useDataStore';
import { useUIStore } from '@/lib/store/useUIStore';
import { Overview } from '@/components/dashboard/Overview';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { StatementTab } from '@/components/dashboard/StatementTab';
import { Recurring } from '@/components/dashboard/Recurring';
import { Fees } from '@/components/dashboard/Fees';
import { Cashflow } from '@/components/dashboard/Cashflow';
import { Review } from '@/components/dashboard/Review';
import { Subscriptions } from '@/components/dashboard/Subscriptions';
import { Budget } from '@/components/dashboard/Budget';
import { Accounts } from '@/components/dashboard/Accounts';
import { DebugPanel } from '@/components/dashboard/DebugPanel';

export default function DashboardPage() {
    const { activeTab, setActiveTab } = useUIStore();
    const { transactions, loadDemoData } = useDataStore();
    const dashboardTab = activeTab === 'stocks' || activeTab === 'crypto' ? 'dashboard' : activeTab;

    // Initial Data Load
    useEffect(() => {
        // Only load demo data if we don't have any data yet
        if (transactions.length === 0) {
            loadDemoData();
        }
    }, [transactions.length, loadDemoData]);

    useEffect(() => {
        if (dashboardTab !== activeTab) {
            setActiveTab(dashboardTab);
        }
    }, [activeTab, dashboardTab, setActiveTab]);

    const renderTab = () => {
        switch (dashboardTab) {
            case 'dashboard':
                return <Dashboard />;
            case 'overview':
                return <Overview />;
            case 'statement':
                return <StatementTab />;
            case 'subscriptions':
                return <Subscriptions />;
            case 'recurring':
                return <Recurring />;
            case 'fees':
                return <Fees />;
            case 'cashflow':
                return <Cashflow />;
            case 'budget':
                return <Budget />;
            case 'accounts':
                return <Accounts />;
            case 'review':
                return <Review />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <div key={dashboardTab}>
                {renderTab()}
            </div>
            <DebugPanel />
        </div>
    );
}
