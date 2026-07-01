export const APP_PROMOTION_METHOD_TREE = {
  promotions: {
    userCoupons: {
      list: true,
      retrieve: true,
      claims: { create: true },
      wallet: {
        list: true,
        retrieve: true,
      },
    },
    offers: {
      list: true,
      retrieve: true,
    },
    codes: {
      redemptions: { create: true },
    },
    discountApplications: {
      create: true,
      settle: true,
      release: true,
      rollback: true,
      reversals: { create: true },
    },
  },
} as const;

export type PromotionRequestParams = Record<string, unknown>;
export type PromotionSdkResponse<T> = Promise<
  T | { code?: number | string; data?: T; message?: string; msg?: string }
>;
export type PromotionSdkMethod = (...args: any[]) => PromotionSdkResponse<any>;

type MethodTree = {
  readonly [key: string]: true | MethodTree;
};

export type ClientFromMethodTree<TTree extends MethodTree> = {
  readonly [TKey in keyof TTree]: TTree[TKey] extends true
    ? PromotionSdkMethod
    : TTree[TKey] extends MethodTree
      ? ClientFromMethodTree<TTree[TKey]>
      : never;
};

export type PromotionAppSdkClient = {
  commerce: ClientFromMethodTree<typeof APP_PROMOTION_METHOD_TREE>;
};
