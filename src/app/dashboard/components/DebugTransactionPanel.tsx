"use client";

import {
  Transaction,
  isInternalTransfer,
  isRealIncome,
  isRealSpending,
  analyzeDuplicateCharges,
  OwnershipMap,
  AccountModeMap,
} from "../../../lib/fakeData";

type DebugTransactionPanelProps = {
  transactions: Transaction[];
  ownership: OwnershipMap;
  accountModes: AccountModeMap;
};

export function DebugTransactionPanel({ transactions, ownership, accountModes }: DebugTransactionPanelProps) {
  const { flaggedTransactionIds, clusters } = analyzeDuplicateCharges(transactions);

  const getDuplicateClusterKey = (transactionId: string) => {
    const cluster = clusters.find((c) => c.transactionIds.includes(transactionId));
    return cluster ? cluster.key : "N/A";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 text-white p-4 overflow-auto max-h-96 border-t border-zinc-700">
      <h2 className="text-lg font-bold mb-2">Debug Transaction View</h2>
      <table className="w-full text-xs text-left">
        <thead>
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Description</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Category</th>
            <th className="p-2">Kind</th>
            <th className="p-2">Internal?</th>
            <th className="p-2">Income?</th>
            <th className="p-2">Spending?</th>
            <th className="p-2">Duplicate?</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-zinc-800">
              <td className="p-2">{tx.date}</td>
              <td className="p-2">{tx.description}</td>
              <td className="p-2">{tx.amount}</td>
              <td className="p-2">{tx.category}</td>
              <td className="p-2">{tx.kind}</td>
              <td className="p-2">{isInternalTransfer(tx, ownership, accountModes) ? "Yes" : "No"}</td>
              <td className="p-2">{isRealIncome(tx, ownership, accountModes) ? "Yes" : "No"}</td>
              <td className="p-2">{isRealSpending(tx, ownership, accountModes) ? "Yes" : "No"}</td>
              <td className="p-2">{flaggedTransactionIds.has(tx.id) ? getDuplicateClusterKey(tx.id) : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
