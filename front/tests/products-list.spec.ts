import { expect, test, type Page } from "@playwright/test";

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await resetApi(page);
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
});

test("shows the first page of the catalog", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Phone Case" })).toBeVisible();
  await expect(page.getByText("17,500")).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Wireless Headphones" }),
  ).toHaveAttribute("href", "/products/1");
});

test("filters the catalog by search text", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search products" }).fill("headphones");

  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smart Watch" })).toHaveCount(0);
  await expect(page.getByText("You've reached the end.")).toBeVisible();
});

test("filters by category", async ({ page }) => {
  await page.getByLabel("Filter by category").selectOption({ label: "Electronics" });

  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Travel Backpack" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smart Watch" })).toHaveCount(0);
});

test("sorts the loaded products from high price to low price", async ({
  page,
}) => {
  await page.getByRole("searchbox", { name: "Search products" }).fill("wireless");
  await expect(
    page.getByRole("heading", { name: "Wireless Mouse" }),
  ).toBeVisible();

  await page.getByLabel("Sort products").selectOption("price-desc");

  await expect(page.getByRole("heading").first()).toHaveText("Wireless Mouse");
});

test("clears filters from the empty state", async ({ page }) => {
  await page
    .getByRole("searchbox", { name: "Search products" })
    .fill("not-a-real-product");

  await expect(
    page.getByRole("heading", { name: "No products found" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Clear" }).click();

  await expect(
    page.getByRole("searchbox", { name: "Search products" }),
  ).toHaveValue("");
  await expect(page.getByLabel("Filter by category")).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
});

test("loads the next page when the list is scrolled", async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(page.getByRole("heading", { name: "Power Bank" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Leather Wallet" }),
  ).toBeVisible();
  await expect(page.getByText("You've reached the end.")).toBeVisible();
});

test("opens a product from the catalog", async ({ page }) => {
  await page
    .getByRole("link")
    .filter({ hasText: "Wireless Headphones" })
    .click();

  await expect(page).toHaveURL(/\/products\/1$/);
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Product Description" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
});
