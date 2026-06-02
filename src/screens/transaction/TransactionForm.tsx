import { useMemo, useState } from "react";
import { PickerSheet } from "@/components/PickerSheet";
import { Presentation } from "@/components/Presentation";
import { AmountInput } from "@/components/form/AmountInput";
import { TypeSwitcher } from "@/components/form/TypeSwitcher";
import { useToast } from "@/components/Toast";
import { DEFAULT_EXPENSE_CATEGORY, resolveGroup } from "@/data/mock";
import type { Recurrence, TransactionType } from "@/data/types";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { cardInvoices, groupAccounts, invoiceLabel } from "@/store/selectors";
import type { NewTransactionInput } from "@/store/types";
import "./TransactionForm.css";

interface Props {
  open: boolean;
  initialType: TransactionType;
  initialGroupId: string;
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ open, initialType, initialGroupId, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [type, setType] = useState<TransactionType>(initialType);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(DEFAULT_EXPENSE_CATEGORY);
  const [accountId, setAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [cardId, setCardId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [settled, setSettled] = useState(true);
  const [ignored, setIgnored] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [installments, setInstallments] = useState(1);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string>();

  // active sub-picker: "group" | "category" | "account" | "from" | "to" | "card" | "invoice"
  const [picker, setPicker] = useState<string | null>(null);

  const currency = resolveGroup(groupId).currency;
  const accounts = useMemo(() => groupAccounts(state, groupId), [state, groupId]);
  const cards = state.cards;
  const invoices = useMemo(() => (cardId ? cardInvoices(state, cardId) : []), [state, cardId]);
  const categories = state.categories.filter((c) =>
    type === "receita" ? c.kind === "income" : c.kind === "expense",
  );

  const reset = () => {
    setAmount(0);
    setDescription("");
    setError(undefined);
  };

  const buildInput = (): NewTransactionInput | null => {
    if (amount === 0) {
      setError("Deve ter um valor diferente de 0");
      return null;
    }
    if (type === "transferencia" && fromAccountId === toAccountId) {
      setError("Origem e destino devem ser diferentes");
      return null;
    }
    const common = { amount, groupId, date, description: description || undefined, ignored };
    if (type === "transferencia") {
      return { type, ...common, fromAccountId, toAccountId, settled: true, recurrence: "none" };
    }
    if (type === "despesa-cartao") {
      return { type, ...common, categoryId, cardId, invoiceId, settled: true, recurrence: "none", installments };
    }
    return { type, ...common, categoryId, accountId, settled, recurrence };
  };

  const save = (again: boolean) => {
    const input = buildInput();
    if (!input) return;
    dispatch({ kind: "ADD_TRANSACTION", input });
    toast.show("Lançamento salvo");
    if (again) reset();
    else onClose();
  };

  return (
    <Presentation open={open} onClose={onClose} ariaLabel="Novo lançamento">
      <header className="txform__header">
        <button type="button" className="txform__cancel" onClick={onClose}>
          Cancelar
        </button>
        <TypeSwitcher value={type} onChange={setType} />
        <span className="txform__spacer" />
      </header>

      <AmountInput value={amount} currency={currency} error={error} onChange={setAmount} />

      <div className="txform__fields">
        <FieldRow label="Grupo" value={resolveGroup(groupId).name} onClick={() => setPicker("group")} />

        <div className="txform__chips">
          {(
            [
              ["Hoje", todayISO()],
              ["Ontem", new Date(Date.now() - 86400000).toISOString().slice(0, 10)],
            ] as const
          ).map(([label, iso]) => (
            <button
              key={label}
              type="button"
              className={`txform__chip${date === iso ? " txform__chip--active" : ""}`}
              onClick={() => setDate(iso)}
            >
              {label}
            </button>
          ))}
          <input
            type="date"
            className="txform__date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <label className="txform__text">
          <span>Descrição</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {type !== "transferencia" && (
          <FieldRow
            label="Categoria"
            value={state.categories.find((c) => c.id === categoryId)?.name ?? "Selecionar"}
            onClick={() => setPicker("category")}
          />
        )}

        {(type === "despesa" || type === "receita") && (
          <FieldRow
            label="Conta"
            value={accounts.find((a) => a.id === accountId)?.name ?? "Selecionar"}
            onClick={() => setPicker("account")}
          />
        )}

        {type === "despesa-cartao" && (
          <>
            <FieldRow
              label="Cartão"
              value={cards.find((c) => c.id === cardId)?.name ?? "Selecionar"}
              onClick={() => setPicker("card")}
            />
            <FieldRow
              label="Fatura"
              value={
                invoices.find((i) => i.id === invoiceId)
                  ? invoiceLabel(
                      invoices.find((i) => i.id === invoiceId)!.month,
                      invoices.find((i) => i.id === invoiceId)!.year,
                    )
                  : "Selecionar"
              }
              onClick={() => setPicker("invoice")}
            />
          </>
        )}

        {type === "transferencia" && (
          <>
            <FieldRow
              label="De"
              value={accounts.find((a) => a.id === fromAccountId)?.name ?? "Selecionar"}
              onClick={() => setPicker("from")}
            />
            <FieldRow
              label="Para"
              value={accounts.find((a) => a.id === toAccountId)?.name ?? "Selecionar"}
              onClick={() => setPicker("to")}
            />
          </>
        )}

        {(type === "despesa" || type === "receita") && (
          <label className="txform__toggle">
            <span>{type === "receita" ? "Recebido" : "Pago"}</span>
            <input type="checkbox" checked={settled} onChange={(e) => setSettled(e.target.checked)} />
          </label>
        )}

        <label className="txform__toggle">
          <span>Ignorar transação</span>
          <input type="checkbox" checked={ignored} onChange={(e) => setIgnored(e.target.checked)} />
        </label>

        <button type="button" className="txform__more" onClick={() => setShowMore((s) => !s)}>
          Mais detalhes {showMore ? "▴" : "▾"}
        </button>

        {showMore && type === "despesa" && (
          <label className="txform__text">
            <span>Recorrência</span>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
              <option value="none">Não repete</option>
              <option value="fixed">Fixa</option>
              <option value="monthly">Mensal</option>
            </select>
          </label>
        )}

        {showMore && type === "despesa-cartao" && (
          <label className="txform__text">
            <span>Parcelas</span>
            <input
              type="number"
              min={1}
              value={installments}
              onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
            />
          </label>
        )}
      </div>

      <footer className="txform__footer">
        <button type="button" className="txform__save-again" onClick={() => save(true)}>
          Salvar e criar nova
        </button>
        <button type="button" className="txform__save" onClick={() => save(false)}>
          Salvar
        </button>
      </footer>

      <PickerSheet
        open={picker === "group"}
        title="Grupo"
        selectedId={groupId}
        options={state.groups.map((g) => ({ id: g.id, label: g.name }))}
        onSelect={(id) => {
          setGroupId(id);
          setAccountId("");
          setCardId("");
          setInvoiceId("");
        }}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "category"}
        title="Categoria"
        selectedId={categoryId}
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
        onSelect={setCategoryId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "account"}
        title="Conta"
        selectedId={accountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "from"}
        title="De"
        selectedId={fromAccountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setFromAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "to"}
        title="Para"
        selectedId={toAccountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setToAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "card"}
        title="Cartão"
        selectedId={cardId}
        options={cards.map((c) => ({ id: c.id, label: c.name }))}
        onSelect={(id) => {
          setCardId(id);
          setInvoiceId("");
        }}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "invoice"}
        title="Fatura"
        selectedId={invoiceId}
        options={invoices.map((i) => ({ id: i.id, label: invoiceLabel(i.month, i.year) }))}
        onSelect={setInvoiceId}
        onClose={() => setPicker(null)}
      />
    </Presentation>
  );
}

function FieldRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="txform__row" onClick={onClick}>
      <span className="txform__row-label">{label}</span>
      <span className="txform__row-value">{value}</span>
    </button>
  );
}
