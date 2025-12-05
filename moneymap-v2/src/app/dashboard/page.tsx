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
import { Stocks } from '@/components/dashboard/Stocks';
import { Crypto } from '@/components/dashboard/Crypto';

export default function DashboardPage() {
    const { activeTab } = useUIStore();
    const { transactions, loadDemoData } = useDataStore();

    // Initial Data Load
    useEffect(() => {
        // Only load demo data if we don't have any data yet
        if (transactions.length === 0) {
            loadDemoData();
        }
    }, [transactions.length, loadDemoData]);

    const renderTab = () => {
        switch (activeTab) {
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
            case 'stocks':
                return <Stocks />;
            case 'crypto':
                return <Crypto />;
            case 'review':
                return <Review />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            {renderTab()}
        </div>
    );
}
