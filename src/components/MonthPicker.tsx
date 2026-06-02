import { useState } from "react";
import { ChevronLeftIcon } from "./icons";
import "./MonthPicker.css";

export const MONTHS_SHORT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface Props {
  month: number;
  year: number;
  onSelect: (month: number, year: number) => void;
  onCancel: () => void;
}

export function MonthPicker({ month, year, onSelect, onCancel }: Props) {
  const [viewYear, setViewYear] = useState(year);

  const goToday = () => {
    const now = new Date();
    onSelect(now.getMonth(), now.getFullYear());
  };

  return (
    <div className="month-picker">
      <div className="month-picker__header">
        <button
          className="month-picker__nav"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label="Ano anterior"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <span className="month-picker__year">{viewYear}</span>
        <button
          className="month-picker__nav"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label="Próximo ano"
        >
          <ChevronLeftIcon size={20} className="is-flipped" />
        </button>
      </div>

      <div className="month-picker__grid">
        {MONTHS_SHORT.map((m, i) => {
          const selected = i === month && viewYear === year;
          return (
            <button
              key={m}
              className={`month-picker__month${selected ? " is-selected" : ""}`}
              onClick={() => onSelect(i, viewYear)}
              aria-current={selected ? "true" : undefined}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="month-picker__footer">
        <button className="month-picker__link" onClick={onCancel}>
          CANCELAR
        </button>
        <button className="month-picker__link" onClick={goToday}>
          MÊS ATUAL
        </button>
      </div>
    </div>
  );
}
