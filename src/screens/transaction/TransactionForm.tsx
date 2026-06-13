import { useEffect, useMemo, useRef, useState } from "react";
import {
  BankIcon,
  CalendarIcon,
  CardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  FileTextIcon,
  GroupIcon,
  PencilIcon,
  PinIcon,
  RepeatIcon,
  TagIcon,
  TransferIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@/components/icons";
import { Presentation } from "@/components/Presentation";
import { useToast } from "@/components/Toast";
import { DEFAULT_EXPENSE_CATEGORY, resolveGroup } from "@/data/mock";
import type { Category, Transaction, TransactionType } from "@/data/types";
import { currencySymbol, formatAmountOnly, parseAmountFromDigits } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { cardInvoices, groupAccounts, invoiceLabel } from "@/store/selectors";
import type { EditScope, NewTransactionInput, UpdateTransactionInput } from "@/store/types";
import "./TransactionForm.css";

interface Props {
  open: boolean;
  initialType: TransactionType;
  initialGroupId: string;
  initialCardId?: string;
  /** When set, the form edits this transaction instead of creating a new one. */
  transaction?: Transaction;
  onClose: () => void;
}

const TYPE_TITLES: Record<TransactionType, string> = {
  despesa: "Nova Despesa",
  receita: "Nova Receita",
  "despesa-cartao": "Nova Desp. Cartão",
  transferencia: "Nova Transferência",
};

const EDIT_TITLES: Record<TransactionType, string> = {
  despesa: "Editar Despesa",
  receita: "Editar Receita",
  "despesa-cartao": "Editar Desp. Cartão",
  transferencia: "Editar Transferência",
};

const SCOPE_OPTIONS: { value: EditScope; label: string }[] = [
  { value: "one", label: "Editar somente esta" },
  { value: "future", label: "Editar esta e as próximas" },
  { value: "all", label: "Editar todas (incluindo anteriores)" },
];

const TYPE_OPTIONS: TransactionType[] = ["despesa", "receita", "despesa-cartao", "transferencia"];

const TYPE_SWITCHABLE: TransactionType[] = TYPE_OPTIONS.filter((t) => t !== "transferencia");
const TYPE_LABELS: Record<TransactionType, string> = {
  despesa: "Despesa",
  receita: "Receita",
  "despesa-cartao": "Despesa cartão",
  transferencia: "Transferência",
};

const TYPE_ICON_TONE: Record<TransactionType, "expense" | "income" | "credit" | "info"> = {
  despesa: "expense",
  receita: "income",
  "despesa-cartao": "credit",
  transferencia: "info",
};

function TypeOptionIcon({ type }: { type: TransactionType }) {
  const size = 22;
  switch (type) {
    case "despesa":
      return <TrendDownIcon size={size} />;
    case "receita":
      return <TrendUpIcon size={size} />;
    case "despesa-cartao":
      return <CardIcon size={size} />;
    case "transferencia":
      return <TransferIcon size={size} />;
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${d}/${months[m - 1]}`;
}

const DROPDOWN_PANEL_WIDTH_RATIO = 0.9;

function dropdownPositionFromTrigger(trigger: HTMLElement): { top: number; left: number; width: number } | null {
  const wrap = trigger.closest(".txform__picker-wrap");
  const panel = trigger.closest(".presentation__panel");
  if (!wrap || !panel) return null;
  const wrapRect = wrap.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const width = panelRect.width * DROPDOWN_PANEL_WIDTH_RATIO;
  const left = panelRect.left + (panelRect.width - width) / 2;
  return { top: wrapRect.bottom + 4, left, width };
}

function isTransactionFormValid(
  type: TransactionType,
  fields: {
    amount: number;
    description: string;
    categoryId: string;
    accountId: string;
    fromAccountId: string;
    toAccountId: string;
    cardId: string;
    invoiceId: string;
  },
): boolean {
  if (fields.amount === 0 || !fields.description.trim()) return false;
  if (type === "transferencia") {
    return Boolean(
      fields.fromAccountId &&
        fields.toAccountId &&
        fields.fromAccountId !== fields.toAccountId,
    );
  }
  if (type === "despesa-cartao") {
    return Boolean(fields.categoryId && fields.cardId && fields.invoiceId);
  }
  return Boolean(fields.categoryId && fields.accountId);
}

export function TransactionForm({ open, initialType, initialGroupId, initialCardId, transaction, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isEdit = transaction != null;

  // core fields
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
  const [editScope, setEditScope] = useState<EditScope>("one");

  // extra fields (Mais detalhes)
  const [tags, setTags] = useState("");
  const [observation, setObservation] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [repeats, setRepeats] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);
  const [repeatFrequency, setRepeatFrequency] = useState<"monthly">("monthly");

  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string>();
  const [descriptionError, setDescriptionError] = useState<string>();

  // inline pickers
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const closeDropdown = () => {
    setExpanded(null);
    setDropdownRect(null);
  };

  const toggle = (field: string, e: React.MouseEvent<HTMLElement>) => {
    if (expanded === field) {
      closeDropdown();
    } else {
      const position = dropdownPositionFromTrigger(e.currentTarget as HTMLElement);
      if (position) setDropdownRect(position);
      setExpanded(field);
    }
  };

  const selectType = (next: TransactionType) => {
    setType(next);
    if (next === "transferencia") {
      setAccountId("");
      setCardId("");
      setInvoiceId("");
      setFromAccountId("");
      setToAccountId("");
      closeDropdown();
      return;
    }
    const kind = next === "receita" ? "income" : "expense";
    const cat = state.categories.find((c) => c.kind === kind);
    if (cat) setCategoryId(cat.id);
    if (next !== "despesa-cartao") {
      setCardId("");
      setInvoiceId("");
    }
    if (next === "despesa-cartao") setAccountId("");
    setFromAccountId("");
    setToAccountId("");
    closeDropdown();
  };

  const currency = resolveGroup(groupId).currency;
  const accounts = useMemo(() => groupAccounts(state, groupId), [state, groupId]);

  useEffect(() => {
    if (!open || type === "despesa-cartao" || type === "transferencia") return;
    setAccountId((current) => {
      if (current && accounts.some((a) => a.id === current)) return current;
      return accounts[0]?.id ?? "";
    });
  }, [open, type, groupId, accounts]);

  const cards = state.cards;
  const invoices = useMemo(() => (cardId ? cardInvoices(state, cardId) : []), [state, cardId]);

  useEffect(() => {
    if (!open || type !== "despesa-cartao") return;
    setCardId((current) => {
      if (current && cards.some((c) => c.id === current)) return current;
      return cards[0]?.id ?? "";
    });
  }, [open, type, cards]);

  useEffect(() => {
    if (!open || type !== "despesa-cartao" || !cardId) return;
    setInvoiceId((current) => {
      if (current && invoices.some((inv) => inv.id === current)) return current;
      return invoices[0]?.id ?? "";
    });
  }, [open, type, cardId, invoices]);

  // Keep the selected category in sync with the type's kind: a despesa must use
  // an expense category and a receita an income category. Resets to the first
  // matching category when the current selection belongs to the other kind.
  useEffect(() => {
    if (!open || type === "transferencia") return;
    const kind = type === "receita" ? "income" : "expense";
    setCategoryId((current) => {
      if (state.categories.some((c) => c.id === current && c.kind === kind)) return current;
      return state.categories.find((c) => c.kind === kind)?.id ?? "";
    });
  }, [open, type, state.categories]);

  // Init on open. Declared after the auto-default effects above so its values
  // win the initial commit; later commits keep valid prefilled selections.
  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setType(transaction.type);
      setGroupId(transaction.groupId);
      setAmount(transaction.amount);
      setDate(transaction.date);
      setDescription(transaction.description ?? "");
      if (transaction.categoryId) setCategoryId(transaction.categoryId);
      setAccountId(transaction.accountId ?? "");
      setFromAccountId(transaction.fromAccountId ?? "");
      setToAccountId(transaction.toAccountId ?? "");
      setCardId(transaction.cardId ?? "");
      setInvoiceId(transaction.invoiceId ?? "");
      setSettled(transaction.settled);
      setIgnored(transaction.ignored);
      setEditScope("one");
      setShowMore(Boolean(transaction.seriesId)); // reveal series scope section
    } else {
      setType(initialType);
      setGroupId(initialGroupId);
      setAmount(0);
      setDescription("");
      setSettled(true);
      setIgnored(false);
      setEditScope("one");
      setShowMore(false);
      if (initialCardId) setCardId(initialCardId);
    }
    setError(undefined);
    setDescriptionError(undefined);
  }, [open, transaction, initialType, initialGroupId, initialCardId]);

  const categories = state.categories.filter((c) => (type === "receita" ? c.kind === "income" : c.kind === "expense"));

  const isFormValid = useMemo(
    () =>
      isTransactionFormValid(type, {
        amount,
        description,
        categoryId,
        accountId,
        fromAccountId,
        toAccountId,
        cardId,
        invoiceId,
      }),
    [type, amount, description, categoryId, accountId, fromAccountId, toAccountId, cardId, invoiceId],
  );

  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isOtherDate = date !== today && date !== yesterday;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const next = parseAmountFromDigits(digits, currency);
    if (next === null) return;
    setAmount(next);
    if (error) setError(undefined);
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      (el as HTMLInputElement & { showPicker(): void }).showPicker();
    } catch {
      el.click();
    }
  };

  const reset = () => {
    setAmount(0);
    setDescription("");
    setError(undefined);
    setDescriptionError(undefined);
    closeDropdown();
  };

  const buildInput = (): NewTransactionInput | null => {
    setDescriptionError(undefined);
    if (amount === 0) {
      setError("Deve ter um valor diferente de 0");
      return null;
    }
    setError(undefined);
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setDescriptionError("Informe uma descrição");
      return null;
    }
    if (type === "transferencia" && fromAccountId === toAccountId) {
      setError("Origem e destino devem ser diferentes");
      return null;
    }
    const common = { amount, groupId, date, description: trimmedDescription, ignored: false };
    if (type === "transferencia") {
      return { type, ...common, fromAccountId, toAccountId, settled: true, recurrence: "none" };
    }
    if (type === "despesa-cartao") {
      const installments = repeats ? repeatCount : 1;
      return { type, ...common, categoryId, cardId, invoiceId, settled: true, recurrence: "none", installments };
    }
    const recurrence = isFixed ? "fixed" : repeats ? "monthly" : "none";
    return { type, ...common, categoryId, accountId, settled, recurrence };
  };

  const buildUpdate = (): UpdateTransactionInput | null => {
    setDescriptionError(undefined);
    if (amount === 0) {
      setError("Deve ter um valor diferente de 0");
      return null;
    }
    setError(undefined);
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setDescriptionError("Informe uma descrição");
      return null;
    }
    if (type === "transferencia" && fromAccountId === toAccountId) {
      setError("Origem e destino devem ser diferentes");
      return null;
    }
    const base = { amount, date, description: trimmedDescription, ignored };
    if (type === "transferencia") {
      return { ...base, fromAccountId, toAccountId, settled: true };
    }
    if (type === "despesa-cartao") {
      return { ...base, categoryId, settled: true };
    }
    return { ...base, categoryId, accountId, settled };
  };

  const save = (again: boolean) => {
    if (isEdit && transaction) {
      const update = buildUpdate();
      if (!update) return;
      dispatch({ kind: "UPDATE_TRANSACTION", id: transaction.id, update, scope: editScope });
      toast.show("Lançamento atualizado");
      onClose();
      return;
    }
    const input = buildInput();
    if (!input) return;
    dispatch({ kind: "ADD_TRANSACTION", input });
    toast.show("Lançamento salvo");
    if (again) reset();
    else onClose();
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCard = cards.find((c) => c.id === cardId);
  const selectedInvoice = invoices.find((i) => i.id === invoiceId);
  const selectedCategory = state.categories.find((c) => c.id === categoryId);
  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const extraFields = (
    <div className="txform__extra-fields">
      {/* Tags */}
      <label className="txform__row txform__row--input">
        <TagIcon size={20} className="txform__row-icon" />
        <input
          className="txform__desc-input"
          placeholder="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <ChevronDownIcon size={18} className="txform__row-icon" />
      </label>
      <div className="txform__divider" />

      {/* Observação */}
      <label className="txform__row txform__row--input">
        <PencilIcon size={20} className="txform__row-icon" />
        <input
          className="txform__desc-input"
          placeholder="Observação"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
        />
      </label>
      <div className="txform__divider" />

      {/* Despesa fixa — only for despesa, create only (series structure not editable) */}
      {!isEdit && type === "despesa" && (
        <>
          <div className="txform__row">
            <PinIcon size={20} className="txform__row-icon" />
            <span className="txform__row-label txform__row-label--grow">Despesa fixa</span>
            <button
              type="button"
              role="switch"
              aria-checked={isFixed}
              className={`txform__toggle${isFixed ? " txform__toggle--on txform__toggle--despesa" : ""}`}
              onClick={() => {
                const next = !isFixed;
                setIsFixed(next);
                if (next) setRepeats(false);
              }}
            />
          </div>
          <div className="txform__divider" />
        </>
      )}

      {/* Repetir — despesa and despesa-cartao, create only */}
      {!isEdit && (type === "despesa" || type === "despesa-cartao") && (
        <>
          <div className="txform__row">
            <RepeatIcon size={20} className="txform__row-icon" />
            <span className="txform__row-label txform__row-label--grow">Repetir</span>
            <button
              type="button"
              role="switch"
              aria-checked={repeats}
              aria-label="Repetir"
              className={`txform__toggle${repeats ? ` txform__toggle--on txform__toggle--${type}` : ""}`}
              onClick={() => {
                const next = !repeats;
                setRepeats(next);
                if (next) setIsFixed(false);
              }}
            />
          </div>
          <div
            className={`txform__repeat-config txform__repeat-config--${type}${repeats ? "" : " is-disabled"}`}
            aria-disabled={!repeats}
          >
            <label className="txform__repeat-cell txform__repeat-cell--count">
              <input
                type="number"
                className="txform__repeat-count"
                min={1}
                value={repeatCount}
                disabled={!repeats}
                onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))}
                aria-label="Quantidade de repetições"
              />
              <span className="txform__repeat-times">vezes</span>
            </label>
            <label className="txform__repeat-cell txform__repeat-cell--freq">
              <select
                className="txform__repeat-freq"
                value={repeatFrequency}
                disabled={!repeats}
                onChange={(e) => setRepeatFrequency(e.target.value as "monthly")}
                aria-label="Frequência da repetição"
              >
                <option value="monthly">Mensal</option>
              </select>
              <ChevronDownIcon size={16} className="txform__repeat-freq-chevron" aria-hidden />
            </label>
          </div>
        </>
      )}

      {/* Série — edit of a repeated/installment transaction */}
      {isEdit && transaction?.seriesId && (
        <div className="txform__series">
          <p className="txform__series-title">Atenção! Esta é uma transação repetida.</p>
          <p className="txform__series-sub">Você deseja:</p>
          <div className="txform__series-options" role="radiogroup" aria-label="Abrangência da edição">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={editScope === opt.value}
                className={`txform__radio${editScope === opt.value ? " is-active" : ""}`}
                onClick={() => setEditScope(opt.value)}
              >
                <span className="txform__radio-dot" aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Presentation
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Editar lançamento" : "Novo lançamento"}
      panelClass={showMore ? "is-wide" : ""}
      closeOnBackdropClick={false}
    >
      {/* HEADER — full width */}
      <header className="txform__header">
        <button type="button" className="txform__cancel" onClick={onClose}>
          Cancelar
        </button>

        <div className="txform__title-wrap txform__picker-wrap">
          <button
            type="button"
            className={`txform__type-btn txform__type-btn--${type}`}
            disabled={type === "transferencia" || isEdit}
            aria-expanded={expanded === "type"}
            aria-haspopup="listbox"
            onClick={(e) => toggle("type", e)}
          >
            <span className="txform__type-label txform__type-label--mobile">{TYPE_LABELS[type]}</span>
            <span className="txform__type-label txform__type-label--desktop">
              {isEdit ? EDIT_TITLES[type] : TYPE_TITLES[type]}
            </span>
            {type !== "transferencia" && !isEdit && (
              <ChevronDownIcon
                size={14}
                className={`txform__type-caret txform__chevron${expanded === "type" ? " is-open" : ""}`}
              />
            )}
          </button>
        </div>

        <span className="txform__header-spacer" aria-hidden="true" />

        <button type="button" className="txform__close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={20} />
        </button>
      </header>

      {/* BODY WRAP — flex row on desktop when expanded */}
      <div className={`txform__body-wrap${showMore ? " txform__body-wrap--split" : ""}`}>
        {/* MAIN COLUMN */}
        <div className="txform__main-col">
          {/* AMOUNT */}
          <div className="txform__amount-section">
            <div className={`txform__amount-field txform__amount-field--${type}`}>
              <span className="txform__amount-currency" aria-hidden="true">
                {currencySymbol(currency)}
              </span>
              <input
                className="txform__amount-input"
                inputMode="numeric"
                aria-label="Valor"
                value={formatAmountOnly(amount, currency)}
                onChange={handleAmountChange}
              />
            </div>
            {error && <p className="txform__error">{error}</p>}
          </div>

          <div className="txform__body">
            {/* SETTLED */}
            {(type === "despesa" || type === "receita") && (
              <div
                className="txform__row"
                role="button"
                tabIndex={0}
                onClick={() => setSettled((s) => !s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSettled((s) => !s);
                  }
                }}
              >
                <CheckIcon size={20} className="txform__row-icon" />
                <span className="txform__row-label txform__row-label--grow">
                  {type === "receita"
                    ? settled
                      ? "Foi recebida"
                      : "Não foi recebida"
                    : settled
                      ? "Foi paga"
                      : "Não foi paga"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settled}
                  tabIndex={-1}
                  className={`txform__toggle${settled ? ` txform__toggle--on txform__toggle--${type}` : ""}`}
                />
              </div>
            )}

            {/* DATE */}
            <div className="txform__row txform__row--date">
              <CalendarIcon size={20} className="txform__row-icon" />
              <div className="txform__date-chips">
                <button
                  type="button"
                  className={`txform__chip${date === today ? ` txform__chip--active txform__chip--${type}` : ""}`}
                  onClick={() => setDate(today)}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className={`txform__chip${date === yesterday ? ` txform__chip--active txform__chip--${type}` : ""}`}
                  onClick={() => setDate(yesterday)}
                >
                  Ontem
                </button>
                <button
                  type="button"
                  className={`txform__chip${isOtherDate ? ` txform__chip--active txform__chip--${type}` : ""}`}
                  onClick={openDatePicker}
                >
                  {isOtherDate ? formatDateShort(date) : "Outros..."}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="txform__date-hidden"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="txform__divider" />

            {/* DESCRIPTION */}
            <div className="txform__field">
              <label
                className={`txform__row txform__row--input${descriptionError ? " txform__row--invalid" : ""}`}
              >
                <FileTextIcon size={20} className="txform__row-icon" />
                <input
                  className="txform__desc-input"
                  placeholder="Descrição *"
                  value={description}
                  required
                  aria-required="true"
                  aria-invalid={descriptionError ? true : undefined}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (descriptionError && e.target.value.trim()) setDescriptionError(undefined);
                  }}
                />
              </label>
              {descriptionError && <p className="txform__field-error">{descriptionError}</p>}
            </div>

            <div className="txform__divider" />

            {/* GRUPO */}
            <div className="txform__row-wrap txform__picker-wrap">
              <button type="button" className="txform__row" onClick={(e) => toggle("group", e)}>
                <GroupIcon size={20} className="txform__row-icon" />
                <span className="txform__row-grow">
                  <span
                    className="txform__group-pill"
                    style={{ "--group-color": resolveGroup(groupId).accent } as React.CSSProperties}
                  >
                    <span className="txform__group-short">{resolveGroup(groupId).short}</span>
                    {resolveGroup(groupId).name}
                  </span>
                </span>
                <ChevronDownIcon
                  size={18}
                  className={`txform__row-icon txform__chevron${expanded === "group" ? " is-open" : ""}`}
                />
              </button>
            </div>
            <div className="txform__divider" />

            {/* CATEGORY */}
            {type !== "transferencia" && (
              <>
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("category", e)}>
                    <TagIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedCategory ? (
                        <CategoryPill category={selectedCategory} />
                      ) : (
                        <span className="txform__row-placeholder">Selecionar</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "category" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
              </>
            )}

            {/* ACCOUNT */}
            {(type === "despesa" || type === "receita") && (
              <>
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("account", e)}>
                    <BankIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedAccount ? (
                        <AccountPill name={selectedAccount.name} />
                      ) : (
                        <span className="txform__row-placeholder">Selecionar conta</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "account" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
              </>
            )}

            {/* CARD + INVOICE */}
            {type === "despesa-cartao" && (
              <>
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("card", e)}>
                    <BankIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedCard ? (
                        <AccountPill name={selectedCard.name} />
                      ) : (
                        <span className="txform__row-placeholder">Selecionar cartão</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "card" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("invoice", e)}>
                    <CardIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedInvoice ? (
                        invoiceLabel(selectedInvoice.month, selectedInvoice.year)
                      ) : (
                        <span className="txform__row-placeholder">Selecionar fatura</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "invoice" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
              </>
            )}

            {/* TRANSFERÊNCIA */}
            {type === "transferencia" && (
              <>
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("from", e)}>
                    <BankIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedFromAccount ? (
                        <AccountPill name={selectedFromAccount.name} />
                      ) : (
                        <span className="txform__row-placeholder">Conta de origem</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "from" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
                <div className="txform__row-wrap txform__picker-wrap">
                  <button type="button" className="txform__row" onClick={(e) => toggle("to", e)}>
                    <BankIcon size={20} className="txform__row-icon" />
                    <span className="txform__row-grow">
                      {selectedToAccount ? (
                        <AccountPill name={selectedToAccount.name} />
                      ) : (
                        <span className="txform__row-placeholder">Conta de destino</span>
                      )}
                    </span>
                    <ChevronDownIcon
                      size={18}
                      className={`txform__row-icon txform__chevron${expanded === "to" ? " is-open" : ""}`}
                    />
                  </button>
                </div>
                <div className="txform__divider" />
              </>
            )}

            {/* IGNORAR — edit only */}
            {isEdit && type !== "transferencia" && (
              <>
                <div
                  className="txform__row"
                  role="button"
                  tabIndex={0}
                  onClick={() => setIgnored((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIgnored((v) => !v);
                    }
                  }}
                >
                  <FileTextIcon size={20} className="txform__row-icon" />
                  <span className="txform__row-label txform__row-label--grow">Ignorar transação</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ignored}
                    aria-label="Ignorar transação"
                    tabIndex={-1}
                    className={`txform__toggle${ignored ? ` txform__toggle--on txform__toggle--${type}` : ""}`}
                  />
                </div>
                <div className="txform__divider" />
              </>
            )}

            {/* MAIS DETALHES BUTTON */}
            <div className="txform__more-wrap">
              <button type="button" className="txform__more-btn" onClick={() => setShowMore((s) => !s)}>
                {showMore ? "Menos detalhes" : "Mais detalhes"}
                <ChevronRightIcon
                  size={15}
                  className={`txform__more-icon${showMore ? " is-open" : ""}`}
                />
              </button>
            </div>

            {/* MOBILE ONLY: extra fields below the button */}
            <div className={`txform__extra-mobile${showMore ? " is-open" : ""}`}>
              <div className="txform__extra-mobile-inner">{extraFields}</div>
            </div>
          </div>
        </div>

        {/* EXTRA COLUMN — desktop only; width animates via .is-open */}
        <aside
          className={`txform__extra-col${showMore ? " is-open" : ""}`}
          aria-hidden={!showMore}
        >
          {extraFields}
        </aside>
      </div>

      {/* FOOTER — full width */}
      <footer className="txform__footer">
        {!isEdit && (
          <button
            type="button"
            className="txform__btn-secondary"
            disabled={!isFormValid}
            onClick={() => save(true)}
          >
            SALVAR E CRIAR NOVA
          </button>
        )}
        <button
          type="button"
          className={`txform__btn-primary txform__btn-primary--${type}`}
          disabled={!isFormValid}
          onClick={() => save(false)}
        >
          SALVAR
        </button>
      </footer>

      {/* FLOATING DROPDOWN */}
      {expanded && dropdownRect && (
        <>
          <div className="txform__dropdown-overlay" onClick={closeDropdown} />
          <div
            className={
              expanded === "type" ? "txform__type-menu action-menu-panel" : "txform__inline-list"
            }
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            {expanded === "type" && (
              <ul className="action-menu" role="listbox" aria-label="Tipo de lançamento">
                {TYPE_SWITCHABLE.map((t) => (
                  <li key={t} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={type === t}
                      className={`action-menu__item${type === t ? " is-selected" : ""}`}
                      onClick={() => selectType(t)}
                    >
                      <span className={`action-menu__icon action-menu__icon--${TYPE_ICON_TONE[t]}`}>
                        <TypeOptionIcon type={t} />
                      </span>
                      <span className="action-menu__label">{TYPE_LABELS[t]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {expanded === "group" &&
              state.groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`txform__inline-item${groupId === g.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setGroupId(g.id);
                    const groupAccts = groupAccounts(state, g.id);
                    setAccountId(groupAccts[0]?.id ?? "");
                    setCardId("");
                    setInvoiceId("");
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-group-badge" style={{ background: g.accent }}>
                    {g.short}
                  </span>
                  {g.name}
                </button>
              ))}
            {expanded === "category" &&
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`txform__inline-item${categoryId === cat.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setCategoryId(cat.id);
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-dot" style={{ background: cat.color }} />
                  {cat.name}
                </button>
              ))}
            {expanded === "account" &&
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`txform__inline-item${accountId === acc.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setAccountId(acc.id);
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-avatar">{acc.name.slice(0, 2).toUpperCase()}</span>
                  {acc.name}
                </button>
              ))}
            {expanded === "card" &&
              cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`txform__inline-item${cardId === c.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setCardId(c.id);
                    setInvoiceId("");
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                  {c.name}
                </button>
              ))}
            {expanded === "invoice" &&
              invoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  className={`txform__inline-item${invoiceId === inv.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setInvoiceId(inv.id);
                    closeDropdown();
                  }}
                >
                  {invoiceLabel(inv.month, inv.year)}
                </button>
              ))}
            {expanded === "from" &&
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`txform__inline-item${fromAccountId === acc.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setFromAccountId(acc.id);
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-avatar">{acc.name.slice(0, 2).toUpperCase()}</span>
                  {acc.name}
                </button>
              ))}
            {expanded === "to" &&
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`txform__inline-item${toAccountId === acc.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setToAccountId(acc.id);
                    closeDropdown();
                  }}
                >
                  <span className="txform__inline-avatar">{acc.name.slice(0, 2).toUpperCase()}</span>
                  {acc.name}
                </button>
              ))}
          </div>
        </>
      )}
    </Presentation>
  );
}

function CategoryPill({ category }: { category: Category }) {
  return (
    <span className="txform__cat-pill" style={{ "--cat-color": category.color } as React.CSSProperties}>
      <span className="txform__cat-dot" />
      {category.name}
    </span>
  );
}

function AccountPill({ name }: { name: string }) {
  const abbr = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="txform__account-pill">
      <span className="txform__account-avatar">{abbr}</span>
      {name}
    </span>
  );
}
