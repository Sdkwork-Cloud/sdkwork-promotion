import { backendApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { CouponStock, CouponStockRequest, DiscountApplication, PageInfo, PromotionCampaign, PromotionCampaignRequest, PromotionCode, PromotionCodeBatch, PromotionCodeBatchRequest, PromotionCouponLedgerEntry, PromotionDistributionRequest, PromotionDistributionTask, PromotionOffer, PromotionOfferRequest, PromotionOverview, PromotionUserCoupon, UpdatePromotionStatusRequest } from '../types';


export interface PromotionsCouponLedgerEntriesListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsCouponLedgerEntriesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** couponLedgerEntries.list */
  async list(params?: PromotionsCouponLedgerEntriesListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/coupon_ledger_entries`), query));
  }
}

export interface PromotionsUserCouponsListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsUserCouponsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** userCoupons.list */
  async list(params?: PromotionsUserCouponsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/user_coupons`), query));
  }
}

export interface PromotionsDistributionTasksListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsDistributionTasksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** distributionTasks.list */
  async list(params?: PromotionsDistributionTasksListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/distribution_tasks`), query));
  }

/** distributionTasks.create */
  async create(body: PromotionDistributionRequest): Promise<PromotionDistributionTask> {
    return this.client.post<PromotionDistributionTask>(backendApiPath(`/promotions/distribution_tasks`), body, undefined, undefined, 'application/json');
  }
}

export interface PromotionsCodeBatchesListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsCodeBatchesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** codeBatches.list */
  async list(params?: PromotionsCodeBatchesListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/code_batches`), query));
  }

/** codeBatches.create */
  async create(body: PromotionCodeBatchRequest): Promise<PromotionCodeBatch> {
    return this.client.post<PromotionCodeBatch>(backendApiPath(`/promotions/code_batches`), body, undefined, undefined, 'application/json');
  }
}

export interface PromotionsCampaignsListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsCampaignsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** campaigns.list */
  async list(params?: PromotionsCampaignsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/campaigns`), query));
  }

/** campaigns.create */
  async create(body: PromotionCampaignRequest): Promise<PromotionCampaign> {
    return this.client.post<PromotionCampaign>(backendApiPath(`/promotions/campaigns`), body, undefined, undefined, 'application/json');
  }

/** campaigns.retrieve */
  async retrieve(campaignId: string): Promise<PromotionCampaign> {
    return this.client.get<PromotionCampaign>(backendApiPath(`/promotions/campaigns/${serializePathParameter(campaignId, { name: 'campaignId', style: 'simple', explode: false })}`));
  }

/** campaigns.update */
  async update(campaignId: string, body: PromotionCampaignRequest): Promise<PromotionCampaign> {
    return this.client.patch<PromotionCampaign>(backendApiPath(`/promotions/campaigns/${serializePathParameter(campaignId, { name: 'campaignId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }

/** campaigns.delete */
  async delete(campaignId: string): Promise<void> {
    return this.client.delete<void>(backendApiPath(`/promotions/campaigns/${serializePathParameter(campaignId, { name: 'campaignId', style: 'simple', explode: false })}`));
  }
}

export interface PromotionsDiscountApplicationsListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsDiscountApplicationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List discount applications */
  async list(params?: PromotionsDiscountApplicationsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/discount_applications`), query));
  }
}

export interface PromotionsCodesListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsCodesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List promotion codes */
  async list(params?: PromotionsCodesListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/codes`), query));
  }
}

export interface PromotionsCouponStocksListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsCouponStocksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List coupon stock */
  async list(params?: PromotionsCouponStocksListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/coupon_stocks`), query));
  }

/** couponStocks.create */
  async create(body: CouponStockRequest): Promise<CouponStock> {
    return this.client.post<CouponStock>(backendApiPath(`/promotions/coupon_stocks`), body, undefined, undefined, 'application/json');
  }
}

export class PromotionsOffersStatusApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Enable or disable a promotion offer */
  async update(offerId: string, body: UpdatePromotionStatusRequest): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/promotions/offers/${serializePathParameter(offerId, { name: 'offerId', style: 'simple', explode: false })}/status`), body, undefined, undefined, 'application/json');
  }
}

export interface PromotionsOffersListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: number;
}

export class PromotionsOffersApi {
  private client: HttpClient;
  public readonly status: PromotionsOffersStatusApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.status = new PromotionsOffersStatusApi(client);
  }


/** List promotion offers */
  async list(params?: PromotionsOffersListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'status', value: params?.status, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/promotions/offers`), query));
  }

/** offers.create */
  async create(body: PromotionOfferRequest): Promise<PromotionOffer> {
    return this.client.post<PromotionOffer>(backendApiPath(`/promotions/offers`), body, undefined, undefined, 'application/json');
  }

/** offers.retrieve */
  async retrieve(offerId: string): Promise<PromotionOffer> {
    return this.client.get<PromotionOffer>(backendApiPath(`/promotions/offers/${serializePathParameter(offerId, { name: 'offerId', style: 'simple', explode: false })}`));
  }

/** offers.update */
  async update(offerId: string, body: PromotionOfferRequest): Promise<PromotionOffer> {
    return this.client.patch<PromotionOffer>(backendApiPath(`/promotions/offers/${serializePathParameter(offerId, { name: 'offerId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }

/** offers.delete */
  async delete(offerId: string): Promise<void> {
    return this.client.delete<void>(backendApiPath(`/promotions/offers/${serializePathParameter(offerId, { name: 'offerId', style: 'simple', explode: false })}`));
  }
}

export class PromotionsOverviewApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve the promotion operations overview */
  async retrieve(): Promise<PromotionOverview> {
    return this.client.get<PromotionOverview>(backendApiPath(`/promotions/overview`));
  }
}

export class PromotionsApi {
  private client: HttpClient;
  public readonly overview: PromotionsOverviewApi;
  public readonly offers: PromotionsOffersApi;
  public readonly couponStocks: PromotionsCouponStocksApi;
  public readonly codes: PromotionsCodesApi;
  public readonly discountApplications: PromotionsDiscountApplicationsApi;
  public readonly campaigns: PromotionsCampaignsApi;
  public readonly codeBatches: PromotionsCodeBatchesApi;
  public readonly distributionTasks: PromotionsDistributionTasksApi;
  public readonly userCoupons: PromotionsUserCouponsApi;
  public readonly couponLedgerEntries: PromotionsCouponLedgerEntriesApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.overview = new PromotionsOverviewApi(client);
    this.offers = new PromotionsOffersApi(client);
    this.couponStocks = new PromotionsCouponStocksApi(client);
    this.codes = new PromotionsCodesApi(client);
    this.discountApplications = new PromotionsDiscountApplicationsApi(client);
    this.campaigns = new PromotionsCampaignsApi(client);
    this.codeBatches = new PromotionsCodeBatchesApi(client);
    this.distributionTasks = new PromotionsDistributionTasksApi(client);
    this.userCoupons = new PromotionsUserCouponsApi(client);
    this.couponLedgerEntries = new PromotionsCouponLedgerEntriesApi(client);
  }

}

export function createPromotionsApi(client: HttpClient): PromotionsApi {
  return new PromotionsApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}
