// PC 应用 shell：装配四个业务包页面，提供顶部导航与 Layout
// 路由结构：/ -> /coupon，含 /coupon、/offer、/pricing、/points 四个业务页

import { NavLink, Outlet, Route, Routes, Navigate } from "react-router-dom";
import { sdkworkPromotionPcRuntimeIdentity } from "@sdkwork/promotion-pc-core";
import { SdkworkCouponPage } from "@sdkwork/promotion-pc-coupon";
import { SdkworkOfferPage } from "@sdkwork/promotion-pc-offer";
import { SdkworkPricingPage } from "@sdkwork/promotion-pc-pricing";
import { SdkworkPointsPage } from "@sdkwork/promotion-pc-points";

interface PromotionShellNavItem {
  readonly to: string;
  readonly label: string;
}

// 顶部导航项：对应四个业务包的入口路由
const PROMOTION_SHELL_NAV_ITEMS: readonly PromotionShellNavItem[] = [
  { to: "/coupon", label: "优惠券" },
  { to: "/offer", label: "优惠方案" },
  { to: "/pricing", label: "定价方案" },
  { to: "/points", label: "积分中心" },
];

// 应用 Layout：包裹顶部导航与 Outlet，所有业务页共享此布局
function PromotionAppLayout() {
  return (
    <div className="promotion-shell">
      <header className="promotion-shell__header">
        <div className="promotion-shell__brand">
          <span className="promotion-shell__brand-title">SDKWork Promotion</span>
          <small className="promotion-shell__brand-meta">
            {sdkworkPromotionPcRuntimeIdentity.appKey}
          </small>
        </div>
        <nav className="promotion-shell__nav" aria-label="主导航">
          {PROMOTION_SHELL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `promotion-shell__nav-link${isActive ? " is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="promotion-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

// PC 应用 shell：装配业务包路由，默认重定向 / 到 /coupon
export function PromotionAppShell() {
  return (
    <Routes>
      <Route element={<PromotionAppLayout />}>
        <Route index element={<Navigate to="/coupon" replace />} />
        <Route path="coupon" element={<SdkworkCouponPage />} />
        <Route path="offer" element={<SdkworkOfferPage />} />
        <Route path="pricing" element={<SdkworkPricingPage />} />
        <Route path="points" element={<SdkworkPointsPage />} />
        <Route path="*" element={<Navigate to="/coupon" replace />} />
      </Route>
    </Routes>
  );
}
