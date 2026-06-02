import type { Currency } from "@/data/types";
import { formatMoney } from "@/lib/format";
import "./AmountInput.css";

interface Props {
  value: number;
  currency: Currency;
  error?: string;
  onChange: (value: number) => void;
}

export function AmountInput({ value, currency, error, onChange }: Props) {
  const handleKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits === "" ? 0 : Number.parseInt(digits, 10);
    onChange(cents / 100);
  };

  return (
    <div className={`amount${error ? " amount--error" : ""}`}>
      <input
        className="amount__field"
        inputMode="numeric"
        aria-label="Valor"
        value={formatMoney(value, currency)}
        onChange={handleKey}
      />
      {error && <span className="amount__error">{error}</span>}
    </div>
  );
}
