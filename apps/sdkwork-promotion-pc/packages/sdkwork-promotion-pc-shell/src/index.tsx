import { sdkworkPromotionPcRuntimeIdentity } from "@sdkwork/promotion-pc-core";

export function PromotionAppShell() {
  return (
    <main className="promotion-shell">
      <section className="promotion-card">
        <h1>SDKWork Promotion</h1>
        <p>{sdkworkPromotionPcRuntimeIdentity.appKey}</p>
        <p>Coupon, offer, pricing, and points capability PC surface — aligned with sdkwork-specs building-block model.</p>
      </section>
    </main>
  );
}
