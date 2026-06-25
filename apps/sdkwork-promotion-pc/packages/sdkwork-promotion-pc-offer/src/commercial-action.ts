export type SdkworkCommercialActionCapability =
  | "billing"
  | "checkout"
  | "commerce"
  | "coupon"
  | "entitlement"
  | "invoice"
  | "offer"
  | "order"
  | "payment"
  | "points"
  | "pricing"
  | "subscription"
  | "wallet";

export type SdkworkCommercialActionIntent =
  | "claim"
  | "exchange"
  | "open"
  | "purchase"
  | "recharge"
  | "renew"
  | "resolve"
  | "review"
  | "upgrade";

export interface SdkworkCommercialAction<
  TCapability extends SdkworkCommercialActionCapability = SdkworkCommercialActionCapability,
  TIntent extends SdkworkCommercialActionIntent = SdkworkCommercialActionIntent,
> {
  capability: TCapability;
  intent: TIntent;
  label: string;
  route: string;
}

export function createSdkworkCommercialAction<
  TCapability extends SdkworkCommercialActionCapability,
  TIntent extends SdkworkCommercialActionIntent,
>(
  action: SdkworkCommercialAction<TCapability, TIntent>,
): SdkworkCommercialAction<TCapability, TIntent> {
  return action;
}
