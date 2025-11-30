import { useCallback, useEffect, useMemo, useState } from "react";

import {
  accountTypeLabels,
  accountTypeOptions,
  STORAGE_ACCOUNT_OVERRIDES_KEY,
  STORAGE_CUSTOM_ACCOUNTS_KEY,
  STORAGE_HIDDEN_ACCOUNTS_KEY,
  STORAGE_OWNERSHIP_MODES_KEY,
  STORAGE_STATEMENT_KEY,
} from "../../../lib/dashboard/config";
import { parseInstitutionAndLast4, type Transaction, TransferAccount, OwnershipMode, OwnershipMap } from "../../../lib/fakeData";
import { descriptionKey, titleCase } from "../../../lib/dashboard/categories";

const loadCustomAccounts = (): TransferAccount[] => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_CUSTOM_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TransferAccount[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore bad data
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
    // ignore bad data
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
    const counts = new Map<string, { label: string; ending?: string; accountType?: string; count: number }>();
    list
      .filter((t) => t.kind.startsWith("transfer"))
      .forEach((t) => {
        const candidates = [t.source, t.target].filter(Boolean) as string[];
        const parsed = parseInstitutionAndLast4(t.description);
        if (parsed.institution) {
          candidates.push(parsed.institution);
        }
        candidates.forEach((raw) => {
          const label = titleCase(raw);
          const ending = parsed.last4 ?? undefined;
          const key = `${label.toLowerCase()}::${ending ?? ""}`;
          const existing = counts.get(key) ?? {
            label,
            ending,
            accountType: inferAccountTypeFromLabel(label),
            count: 0,
          };
          existing.count += 1;
          counts.set(key, existing);
        });
      });
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({
        id: `auto_account_${idx}_${item.label.replace(/\s+/g, "_").toLowerCase()}`,
        label: item.label,
        ownedByDefault: true,
        ending: item.ending,
        accountType: item.accountType,
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
      // ignore
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
      // ignore
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
  const [editingAccountType, setEditingAccountType] = useState(accountTypeOptions[0]);

  useEffect(() => {
    setOwnership(deriveOwnershipFromModes(ownershipModes));
  }, [ownershipModes]);

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

  useEffect(() => {
    if (isAddingAccount && !addBaseTransactionId && transferTransactions.length > 0) {
      const first = transferTransactions[0];
      setAddBaseTransactionId(first.id);
    }
  }, [isAddingAccount, addBaseTransactionId, transferTransactions]);

  const baseAccountParse = useMemo(() => {
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return { institution: null as string | null, last4: null as string | null };
    return parseInstitutionAndLast4(baseTx.description);
  }, [addBaseTransactionId, fullStatementTransactions]);

  const suggestedAccountTransactions = useMemo(() => {
    if (!addBaseTransactionId) return [];
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return [];
    const baseParsed = parseInstitutionAndLast4(baseTx.description);
    const baseKey = descriptionKey(baseTx.description);
    const keywordPattern = /(added|transfer|payment|to|from)/i;
    return fullStatementTransactions.filter((tx) => {
      if (tx.id === addBaseTransactionId) return true;
      const parsed = parseInstitutionAndLast4(tx.description);
      const descLower = tx.description.toLowerCase();
      const looksTransfer = keywordPattern.test(descLower);
      const last4Match =
        baseParsed.last4 !== null && parsed.last4 !== null && baseParsed.last4 === parsed.last4;
      const institutionMatch =
        baseParsed.institution !== null &&
        parsed.institution !== null &&
        baseParsed.institution === parsed.institution &&
        looksTransfer;
      const fallback =
        (baseParsed.institution === null && baseParsed.last4 === null) ||
        (parsed.institution === null && parsed.last4 === null);
      if (last4Match || institutionMatch) return true;
      if (fallback) {
        return descriptionKey(tx.description) === baseKey;
      }
      return false;
    });
  }, [addBaseTransactionId, fullStatementTransactions]);

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
    setEditingAccountType(acc.accountType ?? getAccountTypeLabel(acc));
  };

  const resetEditingAccount = () => {
    setEditingAccountId(null);
    setEditingAccountName("");
    setEditingAccountType(accountTypeOptions[0]);
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
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    const parsed = baseTx ? parseInstitutionAndLast4(baseTx.description) : { institution: null, last4: null };
    const institutionTitle = parsed.institution ? titleCase(parsed.institution) : addAccountName.trim();
    const accountLabelBase = `${institutionTitle} ${accountType.toLowerCase()}`.trim();
    const displayLabel = parsed.last4 ? `${accountLabelBase} ending ${parsed.last4}` : accountLabelBase;
    const newAccount: TransferAccount = {
      id: newId,
      label: accountLabelBase,
      ownedByDefault: true,
      accountType,
      ending: parsed.last4 ?? undefined,
    };
    setCustomAccounts((prev) => [...prev, newAccount]);
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
    transferTransactions,
    resetAccounts,
  };
}
