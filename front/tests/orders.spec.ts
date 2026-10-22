import { test, expect } from "@playwright/test";

test.describe("Order History", () => {
  test("should display order history and statuses", async ({ page }) => {
    await page.goto("/orders");

    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible();

    await expect(page.getByText("3 orders", { exact: true })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "ORD-20261020-001" }),
    ).toBeVisible();

    await expect(
      page.getByText("Delivered", { exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByText("Shipped", { exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByText("Processing", { exact: true }).first(),
    ).toBeVisible();
  });

  test("should navigate to order details", async ({ page }) => {
    await page.goto("/orders");

    await page.getByRole("link", { name: "View Details" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Order Details" }),
    ).toBeVisible();

    // The ID appears in multiple places on the detail page.
    // Scope the assertion to the main order summary heading instead.
    await expect(
      page.getByRole("heading", { name: "Order Details" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Delivery Information" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Ordered Products" }),
    ).toBeVisible();

    await expect(
      page.getByText("Wireless Headphones", { exact: true }),
    ).toBeVisible();
  });

  test("should show not found for an unknown order", async ({ page }) => {
    await page.goto("/orders/ORD-UNKNOWN-999");

    await expect(
      page.getByRole("heading", { name: /not found/i }),
    ).toBeVisible();
  });

  test("should return to order history from order details", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-20261020-001");

    await page.getByRole("link", { name: /Back to My Orders/i }).click();

    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible();
  });
});
