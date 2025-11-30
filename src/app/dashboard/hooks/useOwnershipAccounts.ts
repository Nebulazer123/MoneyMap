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

const parseTransferSides = (description: string) => {
  const match = description.match(/from\s+(.*?)\s+(?:to|->)\s+(.*)/i);
  if (match) {
    const fromRaw = match[1]?.trim() ?? "";
    const toRaw = match[2]?.trim() ?? "";
    const from = extractLabelAndLast4(fromRaw);
    const to = extractLabelAndLast4(toRaw);
    return [
      { ...from, side: "source" as const },
      { ...to, side: "target" as const },
    ];
  }
  const parsed = parseInstitutionAndLast4(description);
  if (parsed.institution) {
    const { label, last4 } = extractLabelAndLast4(parsed.institution);
    return [{ label, last4, side: "source" as const }];
  }
  return [];
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
  const [claimedCandidateKeys, setClaimedCandidateKeys] = useState<Set<string>>(new Set());
  const [candidateDrafts, setCandidateDrafts] = useState<Record<string, CandidateDraft>>({});

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

  const transferAccountIds = useMemo(() => new Set(transferAccounts.map((acc) => acc.id)), [transferAccounts]);

  const existingAccountKeys = useMemo(() => {
    const keys = new Set<string>();
    transferAccounts.forEach((acc) => {
      keys.add(candidateKey(acc.label, acc.ending));
    });
    return keys;
  }, [transferAccounts]);

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
    transferTransactions.forEach((tx) => {
      const sides = parseTransferSides(tx.description);
      sides.forEach((side) => {
        if (side.side === "source" && tx.sourceKey && transferAccountIds.has(tx.sourceKey)) return;
        if (side.side === "target" && tx.targetKey && transferAccountIds.has(tx.targetKey)) return;
        const baseLabel = side.label || tx.source || tx.target || "Account";
        const key = candidateKey(baseLabel, side.last4);
        if (existingAccountKeys.has(key) || claimedCandidateKeys.has(key)) return;
        const accountType = inferAccountTypeFromLabel(baseLabel);
        const existing = candidates.get(key) ?? {
          key,
          label: baseLabel,
          ending: side.last4,
          accountType,
          transactions: [],
          count: 0,
        };
        existing.transactions.push({ tx, side: side.side });
        existing.count += 1;
        candidates.set(key, existing);
      });
    });
    return Array.from(candidates.values()).sort((a, b) => b.count - a.count);
  }, [claimedCandidateKeys, existingAccountKeys, transferTransactions]);

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

  const handleUpdateCandidateDraft = (key: string, draft: Partial<CandidateDraft>) => {
    setCandidateDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...draft } }));
  };

  const handleSaveDetectedAccount = (candidate: CandidateAccount) => {
    const draft = candidateDrafts[candidate.key];
    const name = draft?.name.trim() || candidate.label;
    const accountType = draft?.accountType ?? candidate.accountType;
    const mode = draft?.mode ?? defaultModeForAccountType(accountType);
    const newId = `detected_${Date.now()}`;
    const newAccount: TransferAccount = {
      id: newId,
      label: name,
      ownedByDefault: true,
      accountType,
      ending: candidate.ending,
    };
    setCustomAccounts((prev) => [...prev, newAccount]);
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
    resetAccounts,
    detectedAccountCandidates,
    candidateDrafts,
    handleUpdateCandidateDraft,
    handleSaveDetectedAccount,
    handleCancelCandidate,
  };
}
