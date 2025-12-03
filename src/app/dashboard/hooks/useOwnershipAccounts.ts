import { useCallback, useEffect, useMemo, useState } from "react";

import {
  accountTypeLabels,
  STORAGE_ACCOUNT_OVERRIDES_KEY,
  STORAGE_CUSTOM_ACCOUNTS_KEY,
  STORAGE_HIDDEN_ACCOUNTS_KEY,
  STORAGE_OWNERSHIP_MODES_KEY,
  STORAGE_STATEMENT_KEY,
} from "../../../lib/dashboard/config";
import { parseInstitutionAndLast4, type Transaction, OwnershipMode, OwnershipMap } from "../../../lib/fakeData";
import { titleCase } from "../../../lib/dashboard/categories";

export type TransferAccount = {
  id: string;
  label: string;
  ownedByDefault: boolean;
  accountType?: string;
  ending?: string;
  matchedTransactionIds?: string[]; // Track which transactions are assigned to this account
};

const loadCustomAccounts = (): TransferAccount[] => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_CUSTOM_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TransferAccount[];
        if (Array.isArray(parsed)) {
          // Ensure matchedTransactionIds exists
          return parsed.map(acc => ({
            ...acc,
            matchedTransactionIds: acc.matchedTransactionIds ?? [],
          }));
        }
      }
    }
  } catch {
  }
  return [];
};

const createDefaultOwnershipModes = (accounts: TransferAccount[]) => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_OWNERSHIP_MODES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, OwnershipMode>;
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    }
  } catch {
  }
  return Object.fromEntries(
    accounts.map((acc) => [acc.id, acc.ownedByDefault ? ("spending" as OwnershipMode) : "notMine"]),
  );
};

const deriveOwnershipFromModes = (modes: Record<string, OwnershipMode>): OwnershipMap =>
  Object.fromEntries(
    Object.entries(modes).map(([id, mode]) => [id, mode === "spending" || mode === "payment"]),
  );

const inferAccountTypeFromLabel = (label: string) => {
  const lower = label.toLowerCase();
  if (/(checking)/.test(lower)) return "Checking";
  if (/(savings)/.test(lower)) return "Savings";
  if (/(cash app|wallet|venmo|paypal)/.test(lower)) return "Wallet";
  if (/(visa|card|debit)/.test(lower)) return "Debit card";
  if (/(loan|mortgage|finance|auto)/.test(lower)) return "Loan";
  return "Other";
};

const getAccountTypeLabel = (account: TransferAccount) =>
  account.accountType ??
  accountTypeLabels[account.id] ??
  (account.label.toLowerCase().includes("credit") ? "Credit card" : "Other");

// Account type labels used when editing accounts. Mapped from broader internal/raw types.
type AccountTypeLabel = "Checking" | "Savings" | "Credit card" | "Wallet" | "Loan" | "Other";

const toAccountTypeLabel = (raw: string): AccountTypeLabel => {
  switch (raw) {
    case "Checking":
    case "Savings":
    case "Credit card":
    case "Wallet":
    case "Loan":
      return raw;
    case "Mortgage":
      return "Loan"; // normalize mortgage under loan
    case "Debit card":
      return "Credit card"; // treat debit cards as credit card type for editing purposes
    default:
      return "Other";
  }
};

type CandidateAccount = {
  key: string;
  label: string;
  ending?: string;
  accountType: string;
  transactions: { tx: Transaction; side: "source" | "target" }[];
  count: number;
};

type CandidateDraft = {
  name: string;
  accountType: string;
  mode: OwnershipMode;
  expanded: boolean;
};

const candidateKey = (label: string, ending?: string | null) =>
  `${label.toLowerCase().trim()}::${ending ?? ""}`;

const extractLabelAndLast4 = (raw: string) => {
  const last4Match = raw.match(/ending\s*([0-9]{4})|\b([0-9]{4})\b/i);
  const last4 = last4Match ? last4Match[1] ?? last4Match[2] : null;
  const cleaned = raw.replace(/ending\s*[0-9]{4}/gi, "").replace(/\b[0-9]{4}\b/g, "").trim();
  const label = titleCase(cleaned || raw);
  return { label, last4: last4 ?? undefined };
};

// Normalize transfer description into unique account key
// Strips "Transfer to/from" prefix and extracts account name + last4
const normalizeTransferAccountKey = (description: string): string => {
  // Strip "Transfer to/from" prefix that fakeData.ts now uses
  let cleaned = description.replace(/^transfer\s+(to|from)\s+/i, "").trim();
  
  // Extract last 4 digits if present
  const last4Match = cleaned.match(/\b([0-9]{4})\s*$/i);
  const last4 = last4Match ? last4Match[1] : null;
  
  // Remove last4 from label
  if (last4) {
    cleaned = cleaned.replace(/\b[0-9]{4}\s*$/, "").trim();
  }
  
  // Normalize spacing and case
  const normalized = cleaned.toLowerCase().replace(/\s+/g, " ").trim();
  
  return `${normalized}::${last4 ?? ""}`;
};

export function useOwnershipAccounts({
  fullStatementTransactions,
  statementTransactions,
  setFullStatementTransactions,
}: {
  fullStatementTransactions: Transaction[];
  statementTransactions: Transaction[];
  setFullStatementTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}) {
  const deriveAccountsFromTransactions = useCallback((list: Transaction[]): TransferAccount[] => {
    const accountMap = new Map<string, { label: string; ending?: string; accountType?: string; count: number; txIds: string[] }>();
    
    list
      .filter((t) => t.kind.startsWith("transfer"))
      .forEach((t) => {
        // Use new normalization that understands "Transfer to/from X YYYY" format
        const accountKey = normalizeTransferAccountKey(t.description);
        const parsed = extractLabelAndLast4(t.description.replace(/^transfer\s+(to|from)\s+/i, ""));
        
        const existing = accountMap.get(accountKey) ?? {
          label: parsed.label || "Account",
          ending: parsed.last4,
          accountType: inferAccountTypeFromLabel(parsed.label || "Account"),
          count: 0,
          txIds: [],
        };
        existing.count += 1;
        existing.txIds.push(t.id);
        accountMap.set(accountKey, existing);
      });
    
    return Array.from(accountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({
        id: `auto_account_${idx}_${item.label.replace(/\s+/g, "_").toLowerCase()}`,
        label: item.label,
        ownedByDefault: true,
        ending: item.ending,
        accountType: item.accountType,
        matchedTransactionIds: item.txIds,
      }));
  }, []);

  const inferredAccounts = useMemo(
    () => deriveAccountsFromTransactions(fullStatementTransactions),
    [fullStatementTransactions, deriveAccountsFromTransactions],
  );

  const [customAccounts, setCustomAccounts] = useState<TransferAccount[]>(() => loadCustomAccounts());
  const [accountOverrides, setAccountOverrides] = useState<
    Record<string, { label: string; accountType?: string; ending?: string }>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(STORAGE_ACCOUNT_OVERRIDES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, { label: string; accountType?: string; ending?: string }>;
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
    }
    return {};
  });
  const [hiddenAccountIds, setHiddenAccountIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = window.localStorage.getItem(STORAGE_HIDDEN_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
    }
    return new Set();
  });

  const activeCustomAccounts = useMemo(
    () =>
      customAccounts.filter((acc) =>
        fullStatementTransactions.some(
          (tx) =>
            tx.source?.toLowerCase().includes(acc.label.toLowerCase()) ||
            tx.target?.toLowerCase().includes(acc.label.toLowerCase()) ||
            tx.description.toLowerCase().includes(acc.label.toLowerCase()),
        ),
      ),
    [customAccounts, fullStatementTransactions],
  );

  const transferAccounts = useMemo(() => {
    const overrides = accountOverrides;
    const combined = [...inferredAccounts, ...activeCustomAccounts];
    return combined
      .filter((acc) => !hiddenAccountIds.has(acc.id))
      .map((acc) => {
        const override = overrides[acc.id];
        if (!override) return acc;
        return {
          ...acc,
          label: override.label,
          accountType: override.accountType ?? acc.accountType,
          ending: override.ending ?? acc.ending,
        };
      });
  }, [accountOverrides, activeCustomAccounts, hiddenAccountIds, inferredAccounts]);

  const initialOwnershipModes = useMemo(
    () => createDefaultOwnershipModes(transferAccounts),
    [transferAccounts],
  );
  const [ownershipModes, setOwnershipModes] = useState<Record<string, OwnershipMode>>(
    initialOwnershipModes,
  );
  const [ownership, setOwnership] = useState<OwnershipMap>(() =>
    deriveOwnershipFromModes(initialOwnershipModes),
  );

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addAccountName, setAddAccountName] = useState("");
  const [addAccountType, setAddAccountTypeState] = useState<string>("Checking");
  const [addBaseTransactionId, setAddBaseTransactionId] = useState("");
  const [selectedAccountTxIds, setSelectedAccountTxIds] = useState<Set<string>>(new Set());
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState("");
  const [editingAccountType, setEditingAccountType] = useState<AccountTypeLabel>("Checking");
  const [claimedCandidateKeys, setClaimedCandidateKeys] = useState<Set<string>>(new Set());
  const [candidateDrafts, setCandidateDrafts] = useState<Record<string, CandidateDraft>>({});
  
  // Track which transaction IDs are assigned to accounts
  const [accountAssignments, setAccountAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setOwnership(deriveOwnershipFromModes(ownershipModes));
  }, [ownershipModes]);
  
  // Initialize account assignments from matchedTransactionIds
  useEffect(() => {
    const assignments: Record<string, string[]> = {};
    transferAccounts.forEach(acc => {
      if (acc.matchedTransactionIds && acc.matchedTransactionIds.length > 0) {
        assignments[acc.id] = [...acc.matchedTransactionIds];
      }
    });
    setAccountAssignments(assignments);
  }, [transferAccounts]);

  useEffect(() => {
    const activeIds = new Set(transferAccounts.map((acc) => acc.id));
    setOwnershipModes((prev) => {
      const next: Record<string, OwnershipMode> = {};
      Object.entries(prev).forEach(([id, mode]) => {
        if (activeIds.has(id)) {
          next[id] = mode;
        }
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [transferAccounts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_ACCOUNT_OVERRIDES_KEY, JSON.stringify(accountOverrides));
  }, [accountOverrides]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_HIDDEN_ACCOUNTS_KEY,
      JSON.stringify(Array.from(hiddenAccountIds)),
    );
  }, [hiddenAccountIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_CUSTOM_ACCOUNTS_KEY, JSON.stringify(customAccounts));
  }, [customAccounts]);

  const handleOwnershipModeChange = (accountId: string, mode: OwnershipMode) => {
    setOwnershipModes((prev) => {
      const next = { ...prev, [accountId]: mode };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      const derived = deriveOwnershipFromModes(next);
      setOwnership(derived);
      return next;
    });
  };

  const transferTransactions = useMemo(
    () => statementTransactions.filter((t) => t.kind.startsWith("transfer")),
    [statementTransactions],
  );

  const transferAccountIds = useMemo(() => new Set(transferAccounts.map((acc) => acc.id)), [transferAccounts]);

  const existingAccountKeys = useMemo(() => {
    const keys = new Set<string>();
    transferAccounts.forEach((acc) => {
      keys.add(candidateKey(acc.label, acc.ending));
    });
    return keys;
  }, [transferAccounts]);
  
  // Build set of all assigned transaction IDs across all accounts
  const assignedTransactionIds = useMemo(() => {
    const assigned = new Set<string>();
    transferAccounts.forEach((acc) => {
      const txIds = accountAssignments[acc.id] ?? acc.matchedTransactionIds ?? [];
      txIds.forEach(id => assigned.add(id));
    });
    // Also include transactions being actively edited in manual-add
    if (isAddingAccount) {
      selectedAccountTxIds.forEach(id => assigned.add(id));
    }
    return assigned;
  }, [transferAccounts, accountAssignments, isAddingAccount, selectedAccountTxIds]);
  
  // Compute unassigned transfer transactions (available for manual-add)
  const unassignedTransferTransactions = useMemo(
    () => transferTransactions.filter(tx => !assignedTransactionIds.has(tx.id)),
    [transferTransactions, assignedTransactionIds],
  );

  const availableTransferTransactions = useMemo(
    () =>
      transferTransactions.filter(
        (t) =>
          !(
            (t.sourceKey && transferAccountIds.has(t.sourceKey)) ||
            (t.targetKey && transferAccountIds.has(t.targetKey))
          ),
      ),
    [transferAccountIds, transferTransactions],
  );

  const detectedAccountCandidates: CandidateAccount[] = useMemo(() => {
    const candidates = new Map<string, CandidateAccount>();
    
    // Only consider unassigned transactions for candidates
    unassignedTransferTransactions.forEach((tx) => {
      // Use new normalization for consistent account identity
      const accountKey = normalizeTransferAccountKey(tx.description);
      
      // Skip if this key already exists as an account or was claimed
      if (existingAccountKeys.has(accountKey) || claimedCandidateKeys.has(accountKey)) return;
      
      const parsed = extractLabelAndLast4(tx.description.replace(/^transfer\s+(to|from)\s+/i, ""));
      const baseLabel = parsed.label || "Account";
      const accountType = inferAccountTypeFromLabel(baseLabel);
      
      const existing = candidates.get(accountKey) ?? {
        key: accountKey,
        label: baseLabel,
        ending: parsed.last4,
        accountType,
        transactions: [],
        count: 0,
      };
      
      // Determine side based on transaction flow
      const side: "source" | "target" = tx.amount < 0 ? "source" : "target";
      existing.transactions.push({ tx, side });
      existing.count += 1;
      candidates.set(accountKey, existing);
    });
    
    return Array.from(candidates.values()).sort((a, b) => b.count - a.count);
  }, [unassignedTransferTransactions, existingAccountKeys, claimedCandidateKeys]);

  useEffect(() => {
    setCandidateDrafts((prev) => {
      const next = { ...prev };
      detectedAccountCandidates.forEach((cand) => {
        if (next[cand.key]) return;
        const name = cand.ending ? `${titleCase(cand.label)} ending ${cand.ending}` : titleCase(cand.label);
        const accountType = cand.accountType ?? inferAccountTypeFromLabel(cand.label);
        const mode: OwnershipMode = /credit|loan|debt/i.test(accountType) ? "payment" : "spending";
        next[cand.key] = { name, accountType, mode, expanded: false };
      });
      return next;
    });
  }, [detectedAccountCandidates]);

  useEffect(() => {
    if (isAddingAccount && !addBaseTransactionId && unassignedTransferTransactions.length > 0) {
      const first = unassignedTransferTransactions[0];
      setAddBaseTransactionId(first.id);
    }
  }, [isAddingAccount, addBaseTransactionId, unassignedTransferTransactions]);

  const baseAccountParse = useMemo(() => {
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return { institution: null as string | null, last4: null as string | null };
    return parseInstitutionAndLast4(baseTx.description);
  }, [addBaseTransactionId, fullStatementTransactions]);

  const suggestedAccountTransactions = useMemo(() => {
    if (!addBaseTransactionId) return [];
    const baseTx = unassignedTransferTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return [];
    
    // Use normalized key matching for consistent grouping
    const baseAccountKey = normalizeTransferAccountKey(baseTx.description);
    
    return unassignedTransferTransactions.filter((tx) => {
      if (tx.id === addBaseTransactionId) return true;
      const txAccountKey = normalizeTransferAccountKey(tx.description);
      return txAccountKey === baseAccountKey;
    });
  }, [addBaseTransactionId, unassignedTransferTransactions]);

  useEffect(() => {
    if (!addBaseTransactionId) {
      setSelectedAccountTxIds(new Set());
      return;
    }
    if (suggestedAccountTransactions.length > 0) {
      setSelectedAccountTxIds(new Set(suggestedAccountTransactions.map((tx) => tx.id)));
    } else {
      setSelectedAccountTxIds(new Set([addBaseTransactionId]));
    }
  }, [addBaseTransactionId, suggestedAccountTransactions]);

  useEffect(() => {
    if (!addBaseTransactionId) return;
    if (addAccountName.trim()) return;
    const parsed = baseAccountParse;
    if (parsed.institution) {
      setAddAccountName(titleCase(parsed.institution));
    }
  }, [addBaseTransactionId, baseAccountParse, addAccountName]);

  const handleSelectBaseTransaction = (txId: string) => {
    setAddBaseTransactionId(txId);
    setSelectedAccountTxIds(new Set());
  };

  const handleToggleAccountTransaction = (txId: string) => {
    setSelectedAccountTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const defaultModeForAccountType = (type: string): OwnershipMode =>
    /credit|loan|mortgage/i.test(type) ? "payment" : "spending";

  const startEditingAccount = (acc: TransferAccount) => {
    setEditingAccountId(acc.id);
    setEditingAccountName(acc.label);
    const rawType = acc.accountType ?? getAccountTypeLabel(acc);
    setEditingAccountType(toAccountTypeLabel(rawType));
  };

  const resetEditingAccount = () => {
    setEditingAccountId(null);
    setEditingAccountName("");
    setEditingAccountType("Checking");
  };

  const handleSaveEditedAccount = (acc: TransferAccount) => {
    if (!editingAccountId) return;
    if (!editingAccountName.trim()) return;
    if (customAccounts.some((c) => c.id === acc.id)) {
      setCustomAccounts((prev) =>
        prev.map((c) =>
          c.id === acc.id ? { ...c, label: editingAccountName.trim(), accountType: editingAccountType } : c,
        ),
      );
    } else {
      setAccountOverrides((prev) => ({
        ...prev,
        [acc.id]: {
          label: editingAccountName.trim(),
          accountType: editingAccountType,
          ending: acc.ending,
        },
      }));
    }
    resetEditingAccount();
  };

  const handleDeleteAccount = (acc: TransferAccount) => {
    if (customAccounts.some((c) => c.id === acc.id)) {
      setCustomAccounts((prev) => prev.filter((c) => c.id !== acc.id));
    } else {
      setHiddenAccountIds((prev) => {
        const next = new Set(prev);
        next.add(acc.id);
        return next;
      });
      setAccountOverrides((prev) => {
        const next = { ...prev };
        delete next[acc.id];
        return next;
      });
    }
    setOwnershipModes((prev) => {
      const next = { ...prev };
      delete next[acc.id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
    resetEditingAccount();
  };

  const handleSaveNewAccount = () => {
    if (!addAccountName.trim() || selectedAccountTxIds.size === 0) return;
    const newId = `account_${Date.now()}`;
    const accountType = addAccountType;
    const baseTx = unassignedTransferTransactions.find((tx) => tx.id === addBaseTransactionId);
    const parsed = baseTx ? extractLabelAndLast4(baseTx.description.replace(/^transfer\s+(to|from)\s+/i, "")) : { label: null, last4: null };
    const institutionTitle = parsed.label ? titleCase(parsed.label) : addAccountName.trim();
    const accountLabelBase = institutionTitle;
    const displayLabel = parsed.last4 ? `${accountLabelBase} ending ${parsed.last4}` : accountLabelBase;
    
    const matchedTxIds = Array.from(selectedAccountTxIds);
    const newAccount: TransferAccount = {
      id: newId,
      label: accountLabelBase,
      ownedByDefault: true,
      accountType,
      ending: parsed.last4 ?? undefined,
      matchedTransactionIds: matchedTxIds,
    };
    
    setCustomAccounts((prev) => [...prev, newAccount]);
    setAccountAssignments((prev) => ({ ...prev, [newId]: matchedTxIds }));
    
    setOwnershipModes((prev) => {
      const next = { ...prev, [newId]: defaultModeForAccountType(accountType) };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
    
    setFullStatementTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (!selectedAccountTxIds.has(tx.id)) return tx;
        if (tx.kind.startsWith("transfer")) {
          if (tx.amount < 0) {
            return {
              ...tx,
              sourceKey: tx.sourceKey ?? newId,
              source: tx.source ?? displayLabel,
            };
          }
          return {
            ...tx,
            targetKey: tx.targetKey ?? newId,
            target: tx.target ?? displayLabel,
          };
        }
        return tx;
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    
    setIsAddingAccount(false);
    setAddAccountName("");
    setAddAccountTypeState("Checking");
    setAddBaseTransactionId("");
    setSelectedAccountTxIds(new Set());
  };

  const handleUpdateCandidateDraft = (key: string, draft: Partial<CandidateDraft>) => {
    setCandidateDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...draft } }));
  };

  const handleSaveDetectedAccount = (candidate: CandidateAccount) => {
    const draft = candidateDrafts[candidate.key];
    const name = draft?.name.trim() || candidate.label;
    const accountType = draft?.accountType ?? candidate.accountType;
    const mode = draft?.mode ?? defaultModeForAccountType(accountType);
    const newId = `detected_${Date.now()}`;
    
    const matchedTxIds = candidate.transactions.map(item => item.tx.id);
    const newAccount: TransferAccount = {
      id: newId,
      label: name,
      ownedByDefault: true,
      accountType,
      ending: candidate.ending,
      matchedTransactionIds: matchedTxIds,
    };
    
    setCustomAccounts((prev) => [...prev, newAccount]);
    setAccountAssignments((prev) => ({ ...prev, [newId]: matchedTxIds }));
    
    setOwnershipModes((prev) => {
      const next = { ...prev, [newId]: mode };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      setOwnership(deriveOwnershipFromModes(next));
      return next;
    });
    
    const displayLabel = candidate.ending ? `${name} ending ${candidate.ending}` : name;
    setFullStatementTransactions((prev) => {
      const updated = prev.map((tx) => {
        const match = candidate.transactions.find((item) => item.tx.id === tx.id);
        if (!match) return tx;
        if (match.side === "source") {
          return { ...tx, sourceKey: newId, source: tx.source ?? displayLabel };
        }
        return { ...tx, targetKey: newId, target: tx.target ?? displayLabel };
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    
    setClaimedCandidateKeys((prev) => new Set(prev).add(candidate.key));
    setCandidateDrafts((prev) => {
      const next = { ...prev };
      delete next[candidate.key];
      return next;
    });
  };

  const handleCancelCandidate = (key: string) => {
    setCandidateDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const attachTransactionsToAccount = (accountId: string, txIds: string[]) => {
    if (txIds.length === 0) return;
    
    // Ensure transactions are actually unassigned
    const validTxIds = txIds.filter(id => !assignedTransactionIds.has(id));
    if (validTxIds.length === 0) return;
    
    // Update account assignments
    setAccountAssignments((prev) => {
      const existing = prev[accountId] ?? [];
      return {
        ...prev,
        [accountId]: [...existing, ...validTxIds],
      };
    });
    
    // Update custom accounts to persist matchedTransactionIds
    setCustomAccounts((prev) => prev.map(acc => {
      if (acc.id !== accountId) return acc;
      const existingIds = acc.matchedTransactionIds ?? [];
      return {
        ...acc,
        matchedTransactionIds: [...existingIds, ...validTxIds],
      };
    }));
    
    // Update transaction sourceKey/targetKey
    const account = transferAccounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const displayLabel = account.ending ? `${account.label} ending ${account.ending}` : account.label;
    setFullStatementTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (!validTxIds.includes(tx.id)) return tx;
        if (tx.kind.startsWith("transfer")) {
          if (tx.amount < 0) {
            return { ...tx, sourceKey: accountId, source: tx.source ?? displayLabel };
          }
          return { ...tx, targetKey: accountId, target: tx.target ?? displayLabel };
        }
        return tx;
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };
  
  const resetAccounts = () => {
    setCustomAccounts([]);
    setAccountOverrides({});
    setHiddenAccountIds(new Set());
    setOwnershipModes({});
    setOwnership({});
    setIsAddingAccount(false);
    setAddAccountName("");
    setAddAccountTypeState("Checking");
    setAddBaseTransactionId("");
    setSelectedAccountTxIds(new Set());
    resetEditingAccount();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_CUSTOM_ACCOUNTS_KEY);
      window.localStorage.removeItem(STORAGE_ACCOUNT_OVERRIDES_KEY);
      window.localStorage.removeItem(STORAGE_HIDDEN_ACCOUNTS_KEY);
      window.localStorage.removeItem(STORAGE_OWNERSHIP_MODES_KEY);
    }
  };

  return {
    transferAccounts,
    ownershipModes,
    ownership,
    handleOwnershipModeChange,
    customAccounts,
    setCustomAccounts,
    accountOverrides,
    setAccountOverrides,
    hiddenAccountIds,
    setHiddenAccountIds,
    isAddingAccount,
    setIsAddingAccount,
    addAccountName,
    setAddAccountName,
    addAccountType,
    setAddAccountType: setAddAccountTypeState,
    addBaseTransactionId,
    setAddBaseTransactionId,
    selectedAccountTxIds,
    setSelectedAccountTxIds,
    editingAccountId,
    editingAccountName,
    editingAccountType,
    setEditingAccountType,
    setEditingAccountName,
    startEditingAccount,
    resetEditingAccount,
    handleSaveEditedAccount,
    handleDeleteAccount,
    handleSelectBaseTransaction,
    handleToggleAccountTransaction,
    handleSaveNewAccount,
    suggestedAccountTransactions,
    transferTransactions: availableTransferTransactions,
    unassignedTransferTransactions, // NEW: Only unassigned transactions
    assignedTransactionIds, // NEW: Set of all assigned transaction IDs
    attachTransactionsToAccount, // NEW: Attach transactions to existing account
    resetAccounts,
    detectedAccountCandidates,
    candidateDrafts,
    handleUpdateCandidateDraft,
    handleSaveDetectedAccount,
    handleCancelCandidate,
  };
}
