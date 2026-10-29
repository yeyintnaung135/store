import { expect, test, type Page } from "@playwright/test";

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

async function openOrders(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "admin-token");
  });
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByText("ORD-A01")).toBeVisible();
}

test.describe("Admin orders", () => {
  test.beforeEach(async ({ page }) => {
    await resetApi(page);
    await openOrders(page);
  });

  test("shows the order list and summary", async ({ page }) => {
    await expect(page.getByText("Orders found")).toBeVisible();
    await expect(page.getByText("All orders")).toBeVisible();
    await expect(page.getByText("12 order(s) found")).toBeVisible();
    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
    await expect(page.getByText("Customer 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh orders" })).toBeVisible();
  });

  test("searches orders by customer name", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search orders" }).fill("Aye Aye");

    await expect(page.getByText("ORD-A02")).toBeVisible();
    await expect(page.getByText("ORD-A01")).toHaveCount(0);
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();
  });

  test("searches orders by order number", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search orders" }).fill("ORD-A03");

    await expect(page.getByText("Customer 3")).toBeVisible();
    await expect(page.getByText("ORD-A01")).toHaveCount(0);
  });

  test("shows an empty state when nothing matches", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search orders" })
      .fill("no-matching-order");

    await expect(page.getByText("No orders found")).toBeVisible();
    await expect(page.getByText("No results")).toBeVisible();
  });

  test("filters orders by status", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by order status" })
      .selectOption("PENDING");

    await expect(page.getByText("ORD-A01")).toBeVisible();
    await expect(page.getByText("ORD-A02")).toHaveCount(0);
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();
  });

  test("resets search and status filters", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search orders" }).fill("Aye Aye");
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(page.getByRole("searchbox", { name: "Search orders" })).toHaveValue(
      "",
    );
    await expect(page.getByText("ORD-A01")).toBeVisible();
    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
  });

  test("paginates orders", async ({ page }) => {
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText("Showing 11–12 of 12")).toBeVisible();
    await expect(page.getByText("ORD-A11")).toBeVisible();
    await expect(page.getByText("ORD-A01")).toHaveCount(0);

    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
  });

  test("opens and closes order details", async ({ page }) => {
    const row = page.getByRole("row").filter({ hasText: "ORD-A01" });
    await row.getByRole("button", { name: "View details" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "ORD-A01" })).toBeVisible();
    await expect(dialog.getByText("Customer 1", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Wireless Headphones")).toBeVisible();
    await expect(dialog.getByText("customer1@example.com")).toBeVisible();

    await dialog.getByRole("button", { name: "Close order details" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("updates an order status", async ({ page }) => {
    const row = page.getByRole("row").filter({ hasText: "ORD-A01" });
    await row.getByRole("button", { name: "View details" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Mark as Confirmed" }).click();

    await expect(dialog.getByRole("status")).toHaveText(
      "Order status updated to Confirmed.",
    );
    await dialog.getByRole("button", { name: "Close", exact: true }).click();

    await expect(row.getByText("Confirmed")).toBeVisible();
  });
});
