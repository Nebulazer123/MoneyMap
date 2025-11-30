import { useEffect, useState } from "react";
import { categoryOptions } from "../../../lib/dashboard/config";

export type AddTransactionRowProps = {
  rangeStartMonth: number;
  rangeStartYear: number;
  rangeEndMonth: number;
  rangeEndYear: number;
  onAdd: (details: {
    date: string;
    description: string;
    category: string;
    amount: string;
  }) => boolean;
};

export default function AddTransactionRow({
  rangeStartMonth,
  rangeStartYear,
  rangeEndMonth,
  rangeEndYear,
  onAdd,
}: AddTransactionRowProps) {
  const [date, setDate] = useState(
    `${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`,
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState<string>("-25.00");

  useEffect(() => {
    setDate(`${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`);
  }, [rangeStartMonth, rangeStartYear]);

  const minDate = `${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`;
  const maxDay = new Date(Date.UTC(rangeEndYear, rangeEndMonth + 1, 0)).getUTCDate();
  const maxDate = `${rangeEndYear}-${String(rangeEndMonth + 1).padStart(2, "0")}-${String(maxDay).padStart(2, "0")}`;

  const handleAdd = () => {
    const success = onAdd({
      date,
      description,
      category,
      amount,
    });
    if (success) {
      setDescription("");
      setAmount("-25.00");
    }
  };

  return (
    <div className="grid grid-cols-4 items-center gap-2 text-xs text-zinc-200 sm:text-sm">
      <input
        type="date"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categoryOptions.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <div className="flex items-center justify-end gap-2">
        <input
          type="number"
          step="0.01"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-xs text-white outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Add
        </button>
      </div>
    </div>
  );
}
