import { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { AmountInput } from "@/components/form/AmountInput";
import { Presentation } from "@/components/Presentation";
import { resolveGroup } from "@/data/mock";
import { formatClosingLabel, formatDateLabel, formatDueLabel } from "@/lib/card-utils";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import "./CardForm.css";

interface Props {
  open: boolean;
  groupId: string;
  editCardId?: string;
  onClose: () => void;
}

export function CardForm({ open, groupId, editCardId, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const editCard = editCardId ? state.cards.find((c) => c.id === editCardId) : undefined;
  const isEdit = !!editCard;

  const [formGroupId, setFormGroupId] = useState(groupId);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(0);
  const [closingDay, setClosingDay] = useState<number | undefined>(undefined);
  const [dueDay, setDueDay] = useState<number | undefined>(undefined);
  const [accountId, setAccountId] = useState<string>("");
  const [nameError, setNameError] = useState(false);

  const group = resolveGroup(formGroupId);

  const accounts = useMemo(
    () => state.accounts.filter((a) => a.groupId === formGroupId),
    [state.accounts, formGroupId],
  );

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    if (editCard) {
      setFormGroupId(editCard.groupId);
      setName(editCard.name);
      setLimit(editCard.totalLimit);
      setClosingDay(editCard.closingDay);
      setDueDay(editCard.dueDay);
      setAccountId(editCard.accountId ?? "");
    } else {
      setFormGroupId(groupId);
      setName("");
      setLimit(0);
      setClosingDay(undefined);
      setDueDay(undefined);
      setAccountId("");
    }
    setNameError(false);
  }, [open, editCard, groupId]);

  const valid = name.trim().length > 0 && limit > 0;

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    if (isEdit && editCard) {
      const update: Record<string, unknown> = {};
      if (name !== editCard.name) update.name = name;
      if (limit !== editCard.totalLimit) update.totalLimit = limit;
      if (accountId !== (editCard.accountId ?? "")) update.accountId = accountId || undefined;

      const closingDayChanged = closingDay !== editCard.closingDay;
      const dueDayChanged = dueDay !== editCard.dueDay;

      if (closingDayChanged || dueDayChanged) {
        if (closingDayChanged && closingDay != null) {
          update.closingDay = closingDay;
          update.closingLabel = formatClosingLabel(closingDay);
          update.dateLabel = formatDateLabel(closingDay);
        }
        if (dueDayChanged && dueDay != null) {
          update.dueDay = dueDay;
          update.dueLabel = formatDueLabel(dueDay);
        }
      }

      if (Object.keys(update).length > 0) {
        dispatch({ kind: "UPDATE_CREDIT_CARD", cardId: editCard.id, update } as any);
      }
    } else {
      dispatch({
        kind: "ADD_CREDIT_CARD",
        input: {
          groupId: formGroupId,
          name: name.trim(),
          totalLimit: limit,
          closingDay,
          dueDay,
          accountId: accountId || undefined,
        },
      });
    }

    onClose();
  };

  const handleDayInput = (
    value: string,
    setter: (v: number | undefined) => void,
  ) => {
    const n = Number.parseInt(value, 10);
    if (value === "") {
      setter(undefined);
    } else if (!Number.isNaN(n) && n >= 1 && n <= 31) {
      setter(n);
    }
  };

  return (
    <Presentation
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Editar cartão" : "Novo cartão"}
      closeOnBackdropClick={false}
    >
      <div className="cardform">
        <div className="cardform__header">
          <h2 className="cardform__title">
            {isEdit ? "Editar Cartão" : "Novo Cartão"}
          </h2>
          <button
            type="button"
            className="cardform__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="cardform__body">
          {/* Group selector — only shown when creating, not editing */}
          {!isEdit && (
            <div className="cardform__row">
              <span className="cardform__label">Grupo</span>
              <div className="cardform__groups">
                {state.groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`cardform__group-chip${g.id === formGroupId ? " is-active" : ""}`}
                    style={{ "--accent": g.accent } as React.CSSProperties}
                    onClick={() => setFormGroupId(g.id)}
                  >
                    {g.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="cardform__row">
            <label className="cardform__label" htmlFor="cardform-name">
              Nome do cartão
            </label>
            <input
              id="cardform-name"
              className={`cardform__input${nameError ? " is-error" : ""}`}
              type="text"
              placeholder="Ex: Nubank, Inter, C6"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
              }}
            />
          </div>

          {/* Limit */}
          <div className="cardform__row">
            <span className="cardform__label">Limite do cartão</span>
            <AmountInput
              value={limit}
              currency={group.currency}
              onChange={setLimit}
            />
          </div>

          {/* Closing day + Due day */}
          <div className="cardform__day-row">
            <div className="cardform__row">
              <label className="cardform__label" htmlFor="cardform-closing">
                Dia do fechamento
              </label>
              <input
                id="cardform-closing"
                className="cardform__input"
                type="number"
                min={1}
                max={31}
                placeholder="1-31"
                value={closingDay ?? ""}
                onChange={(e) => handleDayInput(e.target.value, setClosingDay)}
              />
            </div>
            <div className="cardform__row">
              <label className="cardform__label" htmlFor="cardform-due">
                Dia do vencimento
              </label>
              <input
                id="cardform-due"
                className="cardform__input"
                type="number"
                min={1}
                max={31}
                placeholder="1-31"
                value={dueDay ?? ""}
                onChange={(e) => handleDayInput(e.target.value, setDueDay)}
              />
            </div>
          </div>

          {/* Account */}
          <div className="cardform__row">
            <label className="cardform__label" htmlFor="cardform-account">
              Conta vinculada
            </label>
            <select
              id="cardform-account"
              className="cardform__select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Nenhuma conta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cardform__footer">
          <button
            type="button"
            className="cardform__save"
            disabled={!valid}
            onClick={handleSave}
          >
            {isEdit ? "Salvar alterações" : "Criar cartão"}
          </button>
        </div>
      </div>
    </Presentation>
  );
}
