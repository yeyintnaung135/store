import { expect, test } from "@playwright/test";

const product = {
  name: "Wireless Headphones",
  price: "17,500 MMK",
  lineTotalForTwo: "35,000 MMK",
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("shows the product catalog and an empty cart count", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "All Products" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart (0)" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
});

test("filters products from the catalog search", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search products" }).fill(product.name);

  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Smart Watch" }),
  ).toHaveCount(0);
  await expect(page.getByText("Showing 1 of 1 products")).toBeVisible();
});

test("adds a product to the cart and updates quantity and totals", async ({
  page,
}) => {
  await page
    .getByRole("article")
    .filter({ hasText: product.name })
    .getByRole("link", { name: "View Product" })
    .click();

  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
  await expect(page.getByText(product.price)).toBeVisible();

  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible();

  await page.getByRole("link", { name: "Cart (1)" }).click();
  await expect(
    page.getByRole("heading", { name: "Shopping Cart" }),
  ).toBeVisible();
  await expect(page.getByText(product.price).first()).toBeVisible();

  await page
    .getByRole("button", { name: `Increase ${product.name} quantity` })
    .click();
  await expect(page.getByRole("link", { name: "Cart (2)" })).toBeVisible();
  await expect(page.getByText(product.lineTotalForTwo).first()).toBeVisible();

  await page
    .getByRole("button", { name: `Decrease ${product.name} quantity` })
    .click();
  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible();

  await page.getByRole("button", { name: "Clear Cart" }).click();
  await expect(
    page.getByRole("heading", { name: "Your Cart Is Empty" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart (0)" })).toBeVisible();
});

test("keeps the cart after a reload", async ({ page }) => {
  await page.goto("/products/1");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible();
  await page.getByRole("link", { name: "Cart (1)" }).click();
  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
});

test("shows the not-found page for an unknown product", async ({ page }) => {
  await page.goto("/products/99999");

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
