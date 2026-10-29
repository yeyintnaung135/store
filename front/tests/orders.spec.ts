import { expect, test } from "@playwright/test";

test.describe("Order history", () => {
  test("displays order history and statuses", async ({ page }) => {
    await page.goto("/orders");

    await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
    await expect(page.getByText("3 orders", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ORD-20261020-001" }),
    ).toBeVisible();
    await expect(page.getByText("Delivered", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Shipped", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Processing", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue Shopping" }),
    ).toHaveAttribute("href", "/products");
  });

  test("navigates to order details", async ({ page }) => {
    await page.goto("/orders");
    await page.getByRole("link", { name: "View Details" }).first().click();

    await expect(page).toHaveURL(/\/orders\/ORD-20261020-001$/);
    await expect(
      page.getByRole("heading", { name: "Order Details" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Delivery Information" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ordered Products" }),
    ).toBeVisible();
    await expect(page.getByText("Wireless Headphones", { exact: true })).toBeVisible();
    await expect(page.getByText("Demo Customer", { exact: true })).toBeVisible();
  });

  test("shows not found for an unknown order", async ({ page }) => {
    await page.goto("/orders/ORD-UNKNOWN-999");

    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });

  test("returns to order history from order details", async ({ page }) => {
    await page.goto("/orders/ORD-20261020-001");
    await page.getByRole("link", { name: /Back to My Orders/i }).click();

    await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
  });
});
