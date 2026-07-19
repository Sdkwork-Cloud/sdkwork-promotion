import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { NoData, PromotionsCodesRedemptionsCreateRequest, PromotionsCodesRedemptionsCreateResult } from '../types';


export class PromotionsUserCouponsWalletApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List */
  async list(): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/user_coupons/wallet`));
  }

/** Retrieve */
  async retrieve(userCouponId: string): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/user_coupons/wallet/${serializePathParameter(userCouponId, { name: 'userCouponId', style: 'simple', explode: false })}`));
  }
}

export class PromotionsUserCouponsClaimsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Create */
  async create(): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/user_coupon_claims`));
  }
}

export class PromotionsUserCouponsApi {
  private client: HttpClient;
  public readonly claims: PromotionsUserCouponsClaimsApi;
  public readonly wallet: PromotionsUserCouponsWalletApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.claims = new PromotionsUserCouponsClaimsApi(client);
    this.wallet = new PromotionsUserCouponsWalletApi(client);
  }


/** List */
  async list(): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/user_coupons`));
  }

/** Retrieve */
  async retrieve(userCouponId: string): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/user_coupons/${serializePathParameter(userCouponId, { name: 'userCouponId', style: 'simple', explode: false })}`));
  }
}

export class PromotionsOffersApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List */
  async list(): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/offers`));
  }

/** Retrieve */
  async retrieve(offerId: string): Promise<NoData> {
    return this.client.get<NoData>(appApiPath(`/promotions/offers/${serializePathParameter(offerId, { name: 'offerId', style: 'simple', explode: false })}`));
  }
}

export class PromotionsDiscountApplicationsSettlementsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Settle */
  async create(applicationId: string): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/discount_applications/${serializePathParameter(applicationId, { name: 'applicationId', style: 'simple', explode: false })}/settlements`));
  }
}

export class PromotionsDiscountApplicationsReleasesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Release */
  async create(applicationId: string): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/discount_applications/${serializePathParameter(applicationId, { name: 'applicationId', style: 'simple', explode: false })}/releases`));
  }
}

export class PromotionsDiscountApplicationsReversalsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Create */
  async create(): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/discount_applications/reversals`));
  }
}

export class PromotionsDiscountApplicationsApi {
  private client: HttpClient;
  public readonly reversals: PromotionsDiscountApplicationsReversalsApi;
  public readonly releases: PromotionsDiscountApplicationsReleasesApi;
  public readonly settlements: PromotionsDiscountApplicationsSettlementsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.reversals = new PromotionsDiscountApplicationsReversalsApi(client);
    this.releases = new PromotionsDiscountApplicationsReleasesApi(client);
    this.settlements = new PromotionsDiscountApplicationsSettlementsApi(client);
  }


/** Create */
  async create(): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/discount_applications`));
  }

/** Rollback */
  async rollback(applicationId: string): Promise<NoData> {
    return this.client.post<NoData>(appApiPath(`/promotions/discount_applications/${serializePathParameter(applicationId, { name: 'applicationId', style: 'simple', explode: false })}/rollback`));
  }
}

export class PromotionsCodesRedemptionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Create */
  async create(body: PromotionsCodesRedemptionsCreateRequest): Promise<PromotionsCodesRedemptionsCreateResult> {
    return this.client.post<PromotionsCodesRedemptionsCreateResult>(appApiPath(`/promotions/codes/redemptions`), body, undefined, undefined, 'application/json');
  }
}

export class PromotionsCodesApi {
  private client: HttpClient;
  public readonly redemptions: PromotionsCodesRedemptionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.redemptions = new PromotionsCodesRedemptionsApi(client);
  }

}

export class PromotionsApi {
  private client: HttpClient;
  public readonly codes: PromotionsCodesApi;
  public readonly discountApplications: PromotionsDiscountApplicationsApi;
  public readonly offers: PromotionsOffersApi;
  public readonly userCoupons: PromotionsUserCouponsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.codes = new PromotionsCodesApi(client);
    this.discountApplications = new PromotionsDiscountApplicationsApi(client);
    this.offers = new PromotionsOffersApi(client);
    this.userCoupons = new PromotionsUserCouponsApi(client);
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
