import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/products");
});

test("shows the first page of the catalog", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "All Products" }),
  ).toBeVisible();
  await expect(page.getByText("Showing 10 of 50 products")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Power Bank" }),
  ).toHaveCount(0);

  const firstProduct = page
    .getByRole("article")
    .filter({ hasText: "Wireless Headphones" });
  await expect(firstProduct.getByText("17,500 MMK")).toBeVisible();
  await expect(
    firstProduct.getByRole("link", { name: "View Product" }),
  ).toHaveAttribute("href", "/products/1");
});

test("filters the catalog by search text", async ({ page }) => {
  await page
    .getByRole("searchbox", { name: "Search products" })
    .fill("  headphones  ");

  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smart Watch" })).toHaveCount(
    0,
  );
  await expect(page.getByText("Showing 1 of 1 products")).toBeVisible();
  await expect(
    page.getByText("You have viewed all 1 matching products."),
  ).toBeVisible();
});

test("filters by category and search together", async ({ page }) => {
  await page.getByLabel("Filter by category").selectOption("Fashion");

  await expect(page.getByText("Showing 10 of 17 products")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Smart Watch" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toHaveCount(0);

  await page.getByRole("searchbox", { name: "Search products" }).fill("smart watch");

  await expect(page.getByText("Showing 1 of 1 products")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Smart Watch" }),
  ).toBeVisible();
});

test("sorts products from high price to low price", async ({ page }) => {
  await page.getByLabel("Sort products by price").selectOption("price-desc");

  await expect(
    page.getByRole("heading", { name: "Storage Organizer" }),
  ).toBeVisible();
  await expect(page.getByText("140,000 MMK")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toHaveCount(0);
});

test("clears filters from the empty state", async ({ page }) => {
  await page
    .getByRole("searchbox", { name: "Search products" })
    .fill("not-a-real-product");

  await expect(page.getByText("No products found")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear Filters" }).click();

  await expect(page.getByText("Showing 10 of 50 products")).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search products" }),
  ).toHaveValue("");
  await expect(page.getByLabel("Filter by category")).toHaveValue("All");
});

test("loads more products when the list is scrolled", async ({ page }) => {
  await expect(page.getByText("Showing 10 of 50 products")).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(
    page.getByRole("heading", { name: "Power Bank" }),
  ).toBeVisible();
  await expect(page.getByText(/Showing (?:[2-9]\d|50) of 50 products/)).toBeVisible();
});

test("opens a product from the catalog", async ({ page }) => {
  await page
    .getByRole("article")
    .filter({ hasText: "Wireless Headphones" })
    .getByRole("link", { name: "View Product" })
    .click();

  await expect(page).toHaveURL(/\/products\/1$/);
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
});
