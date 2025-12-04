export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  balance: number;
  last4?: string;
  institution?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 YYYY-MM-DD
  amount: number;
  description: string;
  merchantName?: string;
  category: string;
  type: TransactionType;
  accountId: string;
  isRecurring?: boolean;
  isSubscription?: boolean;
  isTransfer?: boolean;
  transferPeerId?: string; // ID of the other transaction if this is a transfer
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  budget?: number;
}

export interface Statement {
  id: string;
  accountId: string;
  month: number; // 1-12
  year: number;
  transactions: Transaction[];
}

export interface DateRange {
  from: Date;
  to: Date;
}
