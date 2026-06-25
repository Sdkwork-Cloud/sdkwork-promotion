import type {
  SdkworkCouponCatalogDigest,
  SdkworkUserCouponDigest,
} from "../coupon";
import type { SdkworkCouponStatistics } from "../coupon-service";
import { createSdkworkCouponPanelStyle } from "../coupon-appearance";
import { useSdkworkCouponIntl } from "../coupon-intl";

export interface SdkworkCouponStatGridProps {
  catalogDigest: SdkworkCouponCatalogDigest;
  statistics: SdkworkCouponStatistics;
  userDigest: SdkworkUserCouponDigest;
}

export function SdkworkCouponStatGrid({
  catalogDigest,
  statistics,
  userDigest,
}: SdkworkCouponStatGridProps) {
  const {
    copy,
    formatCurrencyCny,
  } = useSdkworkCouponIntl();

  const cards = [
    {
      label: copy.stats.availableCoupons,
      value: userDigest.availableCoupons,
    },
    {
      label: copy.stats.claimableOffers,
      value: catalogDigest.claimableCoupons,
    },
    {
      label: copy.stats.expiringSoon,
      value: userDigest.expiringSoonCoupons,
    },
    {
      label: copy.stats.highestDiscount,
      value: formatCurrencyCny(userDigest.highestDiscountAmountCny),
    },
    {
      label: copy.stats.usedCoupons,
      value: statistics.usedCount,
    },
    {
      label: copy.stats.totalInventory,
      value: statistics.totalCoupons,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          className="rounded-[1.6rem] border px-5 py-5 shadow-[var(--sdk-shadow-md)]"
          key={card.label}
          style={createSdkworkCouponPanelStyle("neutral", {
            backgroundWeight: 8,
            borderWeight: 18,
          })}
        >
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
            {card.label}
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
            {card.value}
          </div>
        </article>
      ))}
    </div>
  );
}
