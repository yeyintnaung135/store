import { test, expect } from "@playwright/test";

test.describe("Admin Products", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/products");
  });

  test("should display the products page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Products", exact: true }),
    ).toBeVisible();

    await expect(page.getByText("Total Products")).toBeVisible();
    await expect(page.getByText("Active Products")).toBeVisible();
    await expect(page.getByText("Low Stock", { exact: false })).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
  });

  test("should search products by name", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("Classic Cotton");

    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
    await expect(page.getByText("Wireless Headphones")).toHaveCount(0);
  });

  test("should show empty state for unmatched search", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("not-a-real-product");

    await expect(
      page.getByText("No products found. Try another search or category.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by category" })
      .selectOption("Electronics");

    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toHaveCount(0);
  });

  test("should paginate products", async ({ page }) => {
    await expect(page.getByText("Showing 1–5 of 10 products")).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText("Showing 6–10 of 10 products")).toBeVisible();

    await page.getByRole("button", { name: "Previous", exact: true }).click();

    await expect(page.getByText("Showing 1–5 of 10 products")).toBeVisible();
  });

  test("should open the add product modal", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Add Product" }),
    ).toBeVisible();
  });

  test("should validate required product fields", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    const dialog = page.getByRole("dialog");

    await dialog
      .getByRole("button", { name: "Create Product", exact: true })
      .click();

    await expect(
      dialog.getByText(
        "Enter a product name, a valid price, and a whole-number stock of zero or more.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("should create a product", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Product Name").fill("Playwright Test Product");
    await dialog
      .getByLabel("Category", { exact: true })
      .selectOption("Electronics");
    await dialog.getByLabel("Price (MMK)").fill("25000");
    await dialog.getByLabel("Stock").fill("12");
    await dialog.getByLabel("Status").selectOption("Active");

    await dialog
      .getByRole("button", { name: "Create Product", exact: true })
      .click();

    await expect(dialog).toHaveCount(0);

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("Playwright Test Product");

    await expect(page.getByText("Playwright Test Product")).toBeVisible();
  });

  test("should edit an existing product", async ({ page }) => {
    const productRow = page.getByRole("row").filter({
      hasText: "Classic Cotton T-Shirt",
    });

    await productRow
      .getByRole("button", { name: "Edit Classic Cotton T-Shirt" })
      .click();

    const dialog = page.getByRole("dialog");

    await expect(
      dialog.getByRole("heading", { name: "Edit Product" }),
    ).toBeVisible();

    await dialog.getByLabel("Product Name").fill("Updated Cotton T-Shirt");

    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Updated Cotton T-Shirt")).toBeVisible();
  });

  test("should cancel product deletion", async ({ page }) => {
    const productRow = page.getByRole("row").filter({
      hasText: "Classic Cotton T-Shirt",
    });

    await productRow
      .getByRole("button", { name: "Delete Classic Cotton T-Shirt" })
      .click();

    const alertDialog = page.getByRole("alertdialog");

    await expect(alertDialog).toBeVisible();
    await expect(
      alertDialog.getByRole("heading", { name: "Delete Product?" }),
    ).toBeVisible();

    await alertDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();

    await expect(alertDialog).toHaveCount(0);
    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
  });

  test("should delete a product after confirmation", async ({ page }) => {
    const productRow = page.getByRole("row").filter({
      hasText: "Classic Cotton T-Shirt",
    });

    await productRow
      .getByRole("button", { name: "Delete Classic Cotton T-Shirt" })
      .click();

    const alertDialog = page.getByRole("alertdialog");

    await expect(alertDialog).toBeVisible();

    await expect(alertDialog.getByText("Classic Cotton T-Shirt")).toBeVisible();

    await alertDialog
      .getByRole("button", { name: "Delete", exact: true })
      .click();

    await expect(alertDialog).toHaveCount(0);
    await expect(page.getByText("Classic Cotton T-Shirt")).toHaveCount(0);
  });

  test("should close the add product modal", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

    await expect(dialog).toHaveCount(0);
  });
});
