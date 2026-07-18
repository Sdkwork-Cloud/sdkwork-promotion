import { describe, expect, it, vi } from "vitest";

import { createSdkworkPromotionBackendService } from "../src";

describe("createSdkworkPromotionBackendService", () => {
  it("unwraps paginated offer results", async () => {
    const list = vi.fn().mockResolvedValue({
      code: 0,
      data: {
        items: [{ id: "1", displayName: "Launch" }],
        pageInfo: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      },
      traceId: "trace-1",
    });
    const client = {
      promotions: {
        overview: { retrieve: vi.fn() },
        offers: { list, status: { update: vi.fn() } },
        couponStocks: { list: vi.fn() },
        codes: { list: vi.fn() },
        discountApplications: { list: vi.fn() },
      },
    };

    const service = createSdkworkPromotionBackendService(client as never);
    const page = await service.listOffers({ page: 1, pageSize: 20 });

    expect(page.items[0]?.displayName).toBe("Launch");
    expect(page.totalItems).toBe(1);
    expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 20, q: undefined, status: undefined });
  });

  it("updates an offer through the generated backend client", async () => {
    const update = vi.fn().mockResolvedValue({ accepted: true });
    const client = {
      promotions: {
        overview: { retrieve: vi.fn() },
        offers: { list: vi.fn(), status: { update } },
        couponStocks: { list: vi.fn() },
        codes: { list: vi.fn() },
        discountApplications: { list: vi.fn() },
      },
    };

    const service = createSdkworkPromotionBackendService(client as never);
    await service.updateOfferStatus("42", 1);

    expect(update).toHaveBeenCalledWith("42", { status: 1 });
  });
});
