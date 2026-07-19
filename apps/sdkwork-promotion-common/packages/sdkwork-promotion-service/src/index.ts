import {
  APP_PROMOTION_METHOD_TREE,
  type ClientFromMethodTree,
  type PromotionAppSdkClient,
  type PromotionSdkMethod,
} from "@sdkwork/promotion-sdk-ports";
import type { SdkworkPromotionMutationStatus } from "@sdkwork/promotion-contracts";
import { formatCurrency as formatSdkworkCurrency } from "@sdkwork/utils";
import type {
  CouponStock,
  CouponStockRequest,
  DiscountApplication,
  PromotionCampaign,
  PromotionCampaignRequest,
  PromotionCode,
  PromotionCodeBatch,
  PromotionCodeBatchRequest,
  PromotionCouponLedgerEntry,
  PromotionDistributionRequest,
  PromotionDistributionTask,
  PromotionOffer,
  PromotionOfferRequest,
  PromotionOverview,
  PromotionUserCoupon,
  SdkworkBackendClient as SdkworkPromotionBackendClient,
} from "@sdkwork/promotion-backend-sdk";

export type {
  CouponStock,
  CouponStockRequest,
  DiscountApplication,
  PromotionCampaign,
  PromotionCampaignRequest,
  PromotionCode,
  PromotionCodeBatch,
  PromotionCodeBatchRequest,
  PromotionCouponLedgerEntry,
  PromotionDistributionRequest,
  PromotionDistributionTask,
  PromotionOffer,
  PromotionOfferRequest,
  PromotionOverview,
  PromotionUserCoupon,
} from "@sdkwork/promotion-backend-sdk";

type ServiceTemplate = { readonly [key: string]: true | ServiceTemplate };

export interface PromotionAdminListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export interface PromotionAdminPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SdkworkPromotionBackendService {
  getOverview(): Promise<PromotionOverview>;
  listCampaigns(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionCampaign>>;
  getCampaign(campaignId: string): Promise<PromotionCampaign>;
  createCampaign(input: PromotionCampaignRequest): Promise<PromotionCampaign>;
  updateCampaign(campaignId: string, input: PromotionCampaignRequest): Promise<PromotionCampaign>;
  deleteCampaign(campaignId: string): Promise<void>;
  listOffers(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionOffer>>;
  getOffer(offerId: string): Promise<PromotionOffer>;
  createOffer(input: PromotionOfferRequest): Promise<PromotionOffer>;
  updateOffer(offerId: string, input: PromotionOfferRequest): Promise<PromotionOffer>;
  updateOfferStatus(offerId: string, status: 0 | 1): Promise<void>;
  deleteOffer(offerId: string): Promise<void>;
  listCouponStocks(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<CouponStock>>;
  createCouponStock(input: CouponStockRequest): Promise<CouponStock>;
  listCodeBatches(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionCodeBatch>>;
  createCodeBatch(input: PromotionCodeBatchRequest): Promise<PromotionCodeBatch>;
  listCodes(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionCode>>;
  listDistributionTasks(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionDistributionTask>>;
  createDistributionTask(input: PromotionDistributionRequest): Promise<PromotionDistributionTask>;
  listUserCoupons(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionUserCoupon>>;
  listCouponLedger(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<PromotionCouponLedgerEntry>>;
  listDiscountApplications(query?: PromotionAdminListQuery): Promise<PromotionAdminPage<DiscountApplication>>;
}

function unwrapPromotionPage<T>(value: unknown, page: number, pageSize: number): PromotionAdminPage<T> {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = record.data && typeof record.data === "object"
    ? record.data as Record<string, unknown>
    : record;
  const pageInfo = data.pageInfo && typeof data.pageInfo === "object"
    ? data.pageInfo as Record<string, unknown>
    : {};
  return {
    items: Array.isArray(data.items) ? data.items as T[] : [],
    page: Number(pageInfo.page ?? page),
    pageSize: Number(pageInfo.pageSize ?? pageSize),
    totalItems: Number(pageInfo.totalItems ?? 0),
    totalPages: Number(pageInfo.totalPages ?? 0),
  };
}

function toPromotionListParams(query: PromotionAdminListQuery = {}) {
  return {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    q: query.q?.trim() || undefined,
    status: query.status,
  };
}

export function createSdkworkPromotionBackendService(
  client: SdkworkPromotionBackendClient,
): SdkworkPromotionBackendService {
  const list = async <T>(
    loader: (params: ReturnType<typeof toPromotionListParams>) => Promise<unknown>,
    query: PromotionAdminListQuery = {},
  ) => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return unwrapPromotionPage<T>(await loader(toPromotionListParams(query)), page, pageSize);
  };

  return {
    getOverview: () => client.promotions.overview.retrieve(),
    listCampaigns: (query) => list<PromotionCampaign>((params) => client.promotions.campaigns.list(params), query),
    getCampaign: (campaignId) => client.promotions.campaigns.retrieve(campaignId),
    createCampaign: (input) => client.promotions.campaigns.create(input),
    updateCampaign: (campaignId, input) => client.promotions.campaigns.update(campaignId, input),
    deleteCampaign: (campaignId) => client.promotions.campaigns.delete(campaignId),
    listOffers: (query) => list<PromotionOffer>((params) => client.promotions.offers.list(params), query),
    getOffer: (offerId) => client.promotions.offers.retrieve(offerId),
    createOffer: (input) => client.promotions.offers.create(input),
    updateOffer: (offerId, input) => client.promotions.offers.update(offerId, input),
    async updateOfferStatus(offerId, status) {
      await client.promotions.offers.status.update(offerId, { status });
    },
    deleteOffer: (offerId) => client.promotions.offers.delete(offerId),
    listCouponStocks: (query) => list<CouponStock>((params) => client.promotions.couponStocks.list(params), query),
    createCouponStock: (input) => client.promotions.couponStocks.create(input),
    listCodeBatches: (query) => list<PromotionCodeBatch>((params) => client.promotions.codeBatches.list(params), query),
    createCodeBatch: (input) => client.promotions.codeBatches.create(input),
    listCodes: (query) => list<PromotionCode>((params) => client.promotions.codes.list(params), query),
    listDistributionTasks: (query) => list<PromotionDistributionTask>((params) => client.promotions.distributionTasks.list(params), query),
    createDistributionTask: (input) => client.promotions.distributionTasks.create(input),
    listUserCoupons: (query) => list<PromotionUserCoupon>((params) => client.promotions.userCoupons.list(params), query),
    listCouponLedger: (query) => list<PromotionCouponLedgerEntry>((params) => client.promotions.couponLedgerEntries.list(params), query),
    listDiscountApplications: (query) => list<DiscountApplication>((params) => client.promotions.discountApplications.list(params), query),
  };
}

export type SdkworkPromotionPromotionsService = ClientFromMethodTree<
  (typeof APP_PROMOTION_METHOD_TREE)["promotions"]
>;

export type SdkworkPromotionAppService = {
  promotions: SdkworkPromotionPromotionsService;
};

export type SdkworkPromotionAppServiceProvider = () => SdkworkPromotionAppService;

let sdkworkPromotionAppServiceProvider: SdkworkPromotionAppServiceProvider | null = null;

export interface SdkworkPromotionSessionTokens {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
}

export type SdkworkPromotionSessionTokenProvider = () => SdkworkPromotionSessionTokens;

let sdkworkPromotionSessionTokenProvider: SdkworkPromotionSessionTokenProvider = () => ({});

export interface CreateSdkworkPromotionAppServiceInput {
  appClient: PromotionAppSdkClient;
}

export interface SdkworkPromotionResponseEnvelope<T> {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
}

export function configureSdkworkPromotionAppServiceProvider(
  provider: SdkworkPromotionAppServiceProvider | null,
): void {
  sdkworkPromotionAppServiceProvider = provider;
}

export function configureSdkworkPromotionSessionTokenProvider(
  provider: SdkworkPromotionSessionTokenProvider | null,
): void {
  sdkworkPromotionSessionTokenProvider = provider ?? (() => ({}));
}

export function getSdkworkPromotionService(): SdkworkPromotionAppService {
  if (!sdkworkPromotionAppServiceProvider) {
    throw new Error(
      "SDKWork promotion service provider is not configured. Call configureSdkworkPromotionAppServiceProvider() from promotion PC bootstrap.",
    );
  }
  return sdkworkPromotionAppServiceProvider();
}

export function getSdkworkPromotionSessionTokens(): SdkworkPromotionSessionTokens {
  const tokens = sdkworkPromotionSessionTokenProvider();
  return {
    accessToken: normalizeSessionToken(tokens.accessToken),
    authToken: normalizeSessionToken(tokens.authToken),
    refreshToken: normalizeSessionToken(tokens.refreshToken),
  };
}

export function hasSdkworkPromotionSession(): boolean {
  const tokens = getSdkworkPromotionSessionTokens();
  return Boolean(normalizeSessionToken(tokens.authToken) || normalizeSessionToken(tokens.accessToken));
}

export function requireSdkworkPromotionSession(message = "Authentication required"): void {
  if (!hasSdkworkPromotionSession()) {
    throw new Error(message);
  }
}

export function createSdkworkPromotionAppService(
  input: CreateSdkworkPromotionAppServiceInput,
): SdkworkPromotionAppService {
  return {
    promotions: buildServiceTree<SdkworkPromotionPromotionsService>(
      APP_PROMOTION_METHOD_TREE.promotions,
      input.appClient.commerce.promotions,
      ["commerce", "promotions"],
    ),
  };
}

export function unwrapSdkworkPromotionResponse<T>(value: unknown, fallbackMessage = "Request failed."): T {
  if (!value || typeof value !== "object") {
    return value as T;
  }
  if (!("data" in value) && !("code" in value)) {
    return value as T;
  }
  const envelope = value as SdkworkPromotionResponseEnvelope<T>;
  if (!isSuccessCode(envelope.code)) {
    throw new Error(String(envelope.message || envelope.msg || fallbackMessage).trim());
  }
  return (envelope.data ?? null) as T;
}

export function toSdkworkPromotionOptionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return normalized || undefined;
}

export function toNullableSdkworkPromotionNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function toSdkworkPromotionNumber(value: unknown, fallback = 0): number {
  return toNullableSdkworkPromotionNumber(value) ?? fallback;
}

export function toSdkworkPromotionMutationStatus(status: unknown): SdkworkPromotionMutationStatus {
  const normalized = String(status ?? "").trim().toUpperCase();
  if (normalized === "SUCCESS" || normalized === "COMPLETED" || normalized === "PAID") {
    return "completed";
  }
  if (normalized === "FAILED" || normalized === "REJECTED") {
    return "failed";
  }
  return "pending";
}

export function formatSdkworkPromotionCurrencyCny(value: number | null | undefined, language = "en-US"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }
  return formatSdkworkCurrency(value, "CNY", language) ?? "--";
}

export function formatSdkworkPromotionPoints(value: number, language = "en-US"): string {
  return new Intl.NumberFormat(language).format(value);
}

export function formatSdkworkPromotionPointsRate(points: number, language = "en-US"): string {
  return language === "zh-CN"
    ? `${formatSdkworkPromotionPoints(points, language)} \u79ef\u5206 / 1 \u5143`
    : `${formatSdkworkPromotionPoints(points, language)} pts / CNY 1`;
}

export function formatSdkworkPromotionPointsDelta(value: number, language = "en-US"): string {
  const formatted = formatSdkworkPromotionPoints(Math.abs(value), language);
  if (value > 0) {
    return `+${formatted}`;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  return "0";
}

function buildServiceTree<TService>(
  template: ServiceTemplate,
  client: unknown,
  missingPathPrefix: readonly string[],
  servicePath: readonly string[] = [],
): TService {
  const service: Record<string, unknown> = {};
  for (const [key, marker] of Object.entries(template)) {
    const nextServicePath = [...servicePath, key];
    if (marker === true) {
      const missingPath = [...missingPathPrefix, ...nextServicePath].join(".");
      service[key] = (...args: Parameters<PromotionSdkMethod>) =>
        callPromotion(readMethod(client, nextServicePath), missingPath, ...args);
    } else {
      service[key] = buildServiceTree<Record<string, unknown>>(
        marker,
        client,
        missingPathPrefix,
        nextServicePath,
      );
    }
  }
  return service as TService;
}

function readMethod(root: unknown, path: readonly string[]): PromotionSdkMethod | undefined {
  let node: unknown = root;
  for (const segment of path) {
    if (!node || typeof node !== "object") {
      return undefined;
    }
    const parent = node;
    node = (parent as Record<string, unknown>)[segment];
    if (typeof node === "function") {
      return node.bind(parent) as PromotionSdkMethod;
    }
  }
  return typeof node === "function" ? (node as PromotionSdkMethod) : undefined;
}

async function callPromotion(
  method: PromotionSdkMethod | undefined,
  name: string,
  ...args: Parameters<PromotionSdkMethod>
): Promise<unknown> {
  if (!method) {
    throw new Error(`Missing SDKWork promotion SDK resource: ${name}`);
  }
  return method(...args);
}

function normalizeSessionToken(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function isSuccessCode(code: number | string | undefined): boolean {
  if (code === undefined || code === null || code === "") {
    return true;
  }
  if (typeof code === "number") {
    return code === 0 || code === 200 || code === 2000;
  }
  const normalized = String(code).trim();
  return normalized === "0" || normalized === "200" || normalized === "2000" || normalized === "SUCCESS";
}
