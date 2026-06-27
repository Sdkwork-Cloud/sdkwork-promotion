import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Crown,
} from "lucide-react";
import {
  Button,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import { useSdkworkPointsIntl } from "../points-intl";
import type {
  SdkworkPointsTransaction,
  SdkworkPointsTransactionFilter,
} from "../points-service";

export interface SdkworkPointsTransactionListProps {
  activeFilter: SdkworkPointsTransactionFilter;
  onFilterChange: (filter: SdkworkPointsTransactionFilter) => void;
  transactions: SdkworkPointsTransaction[];
}

function resolveTransactionIcon(transaction: SdkworkPointsTransaction) {
  const normalizedType = (transaction.transactionType || "").toUpperCase();
  if (normalizedType.includes("RECHARGE")) {
    return CreditCard;
  }

  if (normalizedType.includes("MEMBERSHIP") || normalizedType.includes("PURCHASE")) {
    return Crown;
  }

  return transaction.direction === "earned" ? ArrowUpRight : ArrowDownRight;
}

export function SdkworkPointsTransactionList({
  activeFilter,
  onFilterChange,
  transactions,
}: SdkworkPointsTransactionListProps) {
  const {
    copy,
    formatCurrencyCny,
    formatTransactionDelta,
    formatTransactionStatus,
    formatTransactionTimestamp,
  } = useSdkworkPointsIntl();

  return (
    <section className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] shadow-[var(--sdk-shadow-sm)]">
      <div className="flex flex-col gap-4 border-b border-[var(--sdk-color-border-subtle)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
            {copy.transactionList.recordsEyebrow}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--sdk-color-text-primary)]">{copy.transactionList.title}</h2>
          <p className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">
            {copy.transactionList.description}
          </p>
        </div>
        <div className="inline-flex rounded-full bg-[var(--sdk-color-surface-panel-muted)] p-1">
          {(["all", "earned", "spent"] as const).map((filter) => (
            <Button
              className="rounded-full"
              key={filter}
              onClick={() => onFilterChange(filter)}
              size="sm"
              type="button"
              variant={activeFilter === filter ? "secondary" : "ghost"}
            >
              {filter === "all"
                ? copy.filters.all
                : filter === "earned"
                  ? copy.filters.earned
                  : copy.filters.spent}
            </Button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--sdk-color-border-subtle)]">
        {transactions.length === 0 ? (
          <div className="px-6 py-6">
            <StatusNotice title={copy.transactionList.emptyTitle}>
              {copy.transactionList.emptyDescription}
            </StatusNotice>
          </div>
        ) : transactions.map((transaction) => {
          const Icon = resolveTransactionIcon(transaction);
          return (
            <article className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between" key={transaction.id}>
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] ${
                    transaction.direction === "earned"
                      ? "bg-emerald-500/12 text-emerald-500"
                      : "bg-rose-500/12 text-rose-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-[var(--sdk-color-text-primary)]">{transaction.title}</div>
                  <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">
                    {transaction.description || copy.transactionList.fallbackDescription}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--sdk-color-text-muted)]">
                    <span>{formatTransactionTimestamp(transaction.createdAt)}</span>
                    <span>{formatTransactionStatus(transaction.status)}</span>
                    {transaction.cashAmountCny !== undefined ? (
                      <span>{formatCurrencyCny(transaction.cashAmountCny)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className={transaction.direction === "earned" ? "text-emerald-500" : "text-[var(--sdk-color-text-primary)]"}>
                {formatTransactionDelta(transaction.points, transaction.direction)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
