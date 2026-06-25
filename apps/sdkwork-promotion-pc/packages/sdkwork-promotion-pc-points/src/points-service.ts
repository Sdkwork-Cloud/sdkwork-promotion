import type { SdkworkAccountAppService } from "@sdkwork/account-service";
import {
  createSdkworkWalletService,
  type SdkworkWalletRechargeInput,
  type SdkworkWalletRechargePackage,
  type SdkworkWalletService,
  type SdkworkWalletTransaction,
} from "@sdkwork/account-pc-wallet";
import type { SdkworkMembershipAppService } from "@sdkwork/membership-service";
import {
  createSdkworkMembershipService,
  type SdkworkMembershipDashboardData,
  type SdkworkMembershipPlan,
  type SdkworkMembershipService,
} from "@sdkwork/membership-pc-membership";

export type SdkworkPointsTransactionFilter = "all" | "earned" | "spent";
export type SdkworkPointsTransactionDirection = Exclude<SdkworkPointsTransactionFilter, "all">;

export interface SdkworkPointsTransaction {
  cashAmountCny?: number;
  createdAt: string;
  description?: string;
  direction: SdkworkPointsTransactionDirection;
  id: string;
  points: number;
  status: "completed" | "failed" | "pending";
  title: string;
  transactionType?: string;
}

export interface SdkworkPointsRechargeOffer {
  description?: string;
  id: string;
  points: number;
  priceCny: number;
  recommended: boolean;
  title: string;
}

export interface SdkworkPointsPlan {
  description?: string;
  durationDays: number | null;
  id: string;
  includedPoints: number;
  levelName?: string;
  name: string;
  originalPriceCny?: number | null;
  packageId: number;
  priceCny: number;
  recommended: boolean;
  tags: string[];
}

export interface SdkworkPointsCurrentPlan {
  level: number | null;
  name: string;
  remainingDays: number | null;
  status: "active" | "free" | "guest";
  points: number | null;
}

export interface SdkworkPointsSummary {
  balancePoints: number;
  currentPlan: SdkworkPointsCurrentPlan;
  earnedThisMonth: number;
  isAuthenticated: boolean;
  pointsToCashRate: number | null;
  spentThisMonth: number;
  totalEarned: number;
  totalSpent: number;
}

export interface SdkworkPointsDashboardData {
  plans: SdkworkPointsPlan[];
  rechargeOffers: SdkworkPointsRechargeOffer[];
  summary: SdkworkPointsSummary;
  transactions: SdkworkPointsTransaction[];
}

export interface SdkworkPointsRechargeInput extends SdkworkWalletRechargeInput {
  paymentMethod: string;
}

export interface SdkworkPointsRechargeResult {
  cashAmountCny: number | null;
  paymentMethod?: string;
  points: number;
  processedAt?: string;
  remainingPoints?: number | null;
  requestNo?: string;
  status: "completed" | "failed" | "pending";
  transactionId?: string;
}

export interface SdkworkPointsUpgradeInput {
  couponId?: string;
  packageId: number;
  paymentMethod?: string;
}

export interface SdkworkPointsUpgradeResult {
  amountCny: number | null;
  durationDays: number | null;
  orderId?: string;
  packageId: number | null;
  packageName?: string;
  status: "completed" | "failed" | "pending";
  targetLevelName?: string;
}

export interface CreateSdkworkPointsServiceOptions {
  walletAppService?: SdkworkAccountAppService;
  membershipAppService?: SdkworkMembershipAppService;
  locale?: string | null;
  now?: () => string;
  rechargePresets?: number[];
  membershipService?: Pick<SdkworkMembershipService, "getDashboard" | "purchaseMembership">;
  walletService?: Pick<SdkworkWalletService, "getOverview" | "rechargePoints">;
}

export interface SdkworkPointsService {
  getDashboard(): Promise<SdkworkPointsDashboardData>;
  getEmptyDashboard(): SdkworkPointsDashboardData;
  getRechargePresets(): number[];
  rechargePoints(input: SdkworkPointsRechargeInput): Promise<SdkworkPointsRechargeResult>;
  upgradePlan(input: SdkworkPointsUpgradeInput): Promise<SdkworkPointsUpgradeResult>;
}

const DEFAULT_RECHARGE_PRESETS = [500, 1000, 2000, 5000, 10000] as const;

function createCurrentPlan(
  overview: Awaited<ReturnType<SdkworkWalletService["getOverview"]>>,
  membershipDashboard: SdkworkMembershipDashboardData,
): SdkworkPointsCurrentPlan {
  if (!overview.isAuthenticated) {
    return {
      level: null,
      name: "Guest",
      remainingDays: null,
      status: "guest",
      points: null,
    };
  }

  if (!membershipDashboard.summary.isMember) {
    return {
      level: membershipDashboard.summary.currentLevelValue,
      name: "Free",
      remainingDays: membershipDashboard.summary.remainingDays,
      status: "free",
      points: membershipDashboard.summary.points,
    };
  }

  return {
    level: membershipDashboard.summary.currentLevelValue,
    name: membershipDashboard.summary.currentLevelName || "Member",
    remainingDays: membershipDashboard.summary.remainingDays,
    status: "active",
    points: membershipDashboard.summary.points,
  };
}

function mapTransactionStatus(status: string | undefined): "completed" | "failed" | "pending" {
  const normalized = (status || "").trim().toUpperCase();
  if (normalized === "SUCCESS" || normalized === "COMPLETED") {
    return "completed";
  }

  if (normalized === "FAILED") {
    return "failed";
  }

  return "pending";
}

function mapTransaction(transaction: SdkworkWalletTransaction): SdkworkPointsTransaction {
  const direction: SdkworkPointsTransactionDirection = transaction.pointsDelta >= 0 ? "earned" : "spent";

  return {
    ...(transaction.cashAmountCny === null ? {} : { cashAmountCny: transaction.cashAmountCny ?? undefined }),
    createdAt: transaction.createdAt,
    description:
      transaction.title !== transaction.transactionTypeName
        ? transaction.title
        : undefined,
    direction,
    id: transaction.id,
    points: Math.abs(transaction.pointsDelta),
    status: mapTransactionStatus(transaction.status),
    title: transaction.transactionTypeName || transaction.title,
    transactionType: transaction.transactionType,
  };
}

function mapRechargeOffer(rechargePackage: SdkworkWalletRechargePackage): SdkworkPointsRechargeOffer {
  return {
    description: rechargePackage.description,
    id: `recharge-package-${rechargePackage.id}`,
    points: rechargePackage.points,
    priceCny: rechargePackage.priceCny,
    recommended: rechargePackage.recommended,
    title: rechargePackage.title,
  };
}

function sortRechargeOffers(
  offers: SdkworkPointsRechargeOffer[],
): SdkworkPointsRechargeOffer[] {
  return [...offers].sort(
    (left, right) =>
      Number(right.recommended) - Number(left.recommended)
      || right.points - left.points
      || left.priceCny - right.priceCny
      || left.id.localeCompare(right.id),
  );
}

function mapPlan(plan: SdkworkMembershipPlan): SdkworkPointsPlan {
  return {
    description: plan.description,
    durationDays: plan.durationDays,
    id: plan.id,
    includedPoints: plan.includedPoints,
    levelName: plan.levelName,
    name: plan.name,
    originalPriceCny: plan.originalPriceCny,
    packageId: plan.packageId,
    priceCny: plan.priceCny,
    recommended: plan.recommended,
    tags: plan.tags,
  };
}

function sortPlans(plans: SdkworkPointsPlan[]): SdkworkPointsPlan[] {
  return [...plans].sort(
    (left, right) =>
      Number(right.recommended) - Number(left.recommended)
      || right.includedPoints - left.includedPoints
      || left.priceCny - right.priceCny
      || left.id.localeCompare(right.id),
  );
}

function createMonthRange(nowIso: string): { end: number; start: number } {
  const now = new Date(nowIso);
  return {
    end: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    start: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  };
}

function computeMonthlyTotals(
  transactions: SdkworkPointsTransaction[],
  nowIso: string,
): { earnedThisMonth: number; spentThisMonth: number } {
  const range = createMonthRange(nowIso);

  return transactions.reduce(
    (totals, transaction) => {
      const timestamp = new Date(transaction.createdAt).getTime();
      if (timestamp < range.start || timestamp >= range.end) {
        return totals;
      }

      if (transaction.direction === "earned") {
        return {
          ...totals,
          earnedThisMonth: totals.earnedThisMonth + transaction.points,
        };
      }

      return {
        ...totals,
        spentThisMonth: totals.spentThisMonth + transaction.points,
      };
    },
    {
      earnedThisMonth: 0,
      spentThisMonth: 0,
    },
  );
}

export function createEmptySdkworkPointsDashboard(): SdkworkPointsDashboardData {
  return {
    plans: [],
    rechargeOffers: [],
    summary: {
      balancePoints: 0,
      currentPlan: {
        level: null,
        name: "Guest",
        remainingDays: null,
        status: "guest",
        points: null,
      },
      earnedThisMonth: 0,
      isAuthenticated: false,
      pointsToCashRate: null,
      spentThisMonth: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
    transactions: [],
  };
}

export function filterSdkworkPointsTransactions(
  transactions: SdkworkPointsTransaction[],
  filter: SdkworkPointsTransactionFilter,
): SdkworkPointsTransaction[] {
  if (filter === "all") {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.direction === filter);
}

export function createSdkworkPointsService(
  options: CreateSdkworkPointsServiceOptions = {},
): SdkworkPointsService {
  const walletService = options.walletService ?? createSdkworkWalletService({
    accountAppService: options.walletAppService,
  });
  const membershipService = options.membershipService ?? createSdkworkMembershipService({
    membershipAppService: options.membershipAppService,
    locale: options.locale,
  });
  const now = options.now ?? (() => new Date().toISOString());
  const rechargePresets = options.rechargePresets ?? [...DEFAULT_RECHARGE_PRESETS];

  return {
    async getDashboard() {
      const [overview, membershipDashboard] = await Promise.all([
        walletService.getOverview(),
        membershipService.getDashboard(),
      ]);
      if (!overview.isAuthenticated) {
        return createEmptySdkworkPointsDashboard();
      }

      const transactions = overview.transactions
        .map(mapTransaction)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
      const monthlyTotals = computeMonthlyTotals(transactions, now());

      return {
        plans: sortPlans(membershipDashboard.plans.map(mapPlan)),
        rechargeOffers: sortRechargeOffers(overview.rechargePackages.map(mapRechargeOffer)),
        summary: {
          balancePoints: overview.account.availablePoints,
          currentPlan: createCurrentPlan(overview, membershipDashboard),
          earnedThisMonth: monthlyTotals.earnedThisMonth,
          isAuthenticated: true,
          pointsToCashRate: overview.pointsToCashRate,
          spentThisMonth: monthlyTotals.spentThisMonth,
          totalEarned: overview.account.totalEarned,
          totalSpent: overview.account.totalSpent,
        },
        transactions,
      };
    },

    getEmptyDashboard() {
      return createEmptySdkworkPointsDashboard();
    },

    getRechargePresets() {
      return [...rechargePresets];
    },

    async rechargePoints(input) {
      const result = await walletService.rechargePoints(input);

      return {
        cashAmountCny: result.cashAmountCny,
        paymentMethod: result.paymentMethod,
        points: result.points,
        processedAt: result.processedAt,
        remainingPoints: result.remainingPoints,
        requestNo: result.requestNo,
        status: result.status,
        transactionId: result.transactionId,
      };
    },

    async upgradePlan(input) {
      const result = await membershipService.purchaseMembership(input);

      return {
        amountCny: result.amountCny,
        durationDays: result.durationDays,
        orderId: result.orderId,
        packageId: result.packageId,
        packageName: result.packageName,
        status: result.status,
        targetLevelName: result.targetLevelName,
      };
    },
  };
}

export const sdkworkPointsService = createSdkworkPointsService();
