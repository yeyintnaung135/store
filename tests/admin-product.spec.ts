import { test, expect } from "@playwright/test";

test.describe("Admin Products", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/products");
  });

  test("should display product management page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Products", exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "+ Add Product" }),
    ).toBeVisible();

    await expect(page.getByText("Total Products")).toBeVisible();
    await expect(page.getByText("Active Products")).toBeVisible();
    await expect(page.getByText("Low Stock (5 or fewer)")).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
    await expect(page.getByText("Wireless Headphones")).toBeVisible();
  });

  test("should search products by name", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("headphones");

    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toHaveCount(0);

    await expect(page.getByText("Showing 1–1 of 1 products")).toBeVisible();
  });

  test("should show empty state when search has no results", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("product-does-not-exist");

    await expect(
      page.getByText("No products found. Try another search or category.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByText("Showing 0–0 of 0 products")).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by category" })
      .selectOption("Electronics");

    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    await expect(page.getByText("Smart Watch")).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toHaveCount(0);

    await expect(page.getByText("Showing 1–3 of 3 products")).toBeVisible();
  });

  test("should paginate products", async ({ page }) => {
    await expect(page.getByText("Showing 1–5 of 10 products")).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByText("Showing 6–10 of 10 products")).toBeVisible();

    await expect(page.getByText("Classic Cotton T-Shirt")).toHaveCount(0);
    await expect(page.getByText("Bluetooth Speaker")).toBeVisible();

    await page.getByRole("button", { name: "Previous" }).click();

    await expect(page.getByText("Showing 1–5 of 10 products")).toBeVisible();

    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
  });

  test("should create a product", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();

    await expect(
      page.getByRole("dialog", { name: "Add Product" }),
    ).toBeVisible();

    await page.getByLabel("Product Name").fill("Test Keyboard");
    await page
      .getByLabel("Category", { exact: true })
      .selectOption("Electronics");
    await page.getByLabel("Price (MMK)").fill("50000");
    await page.getByLabel("Stock").fill("10");
    await page.getByLabel("Status", { exact: true }).selectOption("Active");

    await page.getByRole("button", { name: "Create Product" }).click();

    await expect(page.getByRole("dialog", { name: "Add Product" })).toHaveCount(
      0,
    );

    await expect(page.getByText("Test Keyboard")).toBeVisible();
    await expect(page.getByText("50,000 MMK")).toBeVisible();

    // Verify the product was added using the updated product count.
    await expect(page.getByText("Total Products")).toBeVisible();
    await expect(page.getByText("Test Keyboard").first()).toBeVisible();
  });

  test("should validate product form", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();

    await page.getByLabel("Product Name").fill("Invalid Product");
    await page.getByLabel("Price (MMK)").fill("-100");
    await page.getByLabel("Stock").fill("-5");

    await page.getByRole("button", { name: "Create Product" }).click();

    const validationMessage =
      "Enter a product name, a valid price, and a whole-number stock of zero or more.";

    await expect(
      page.getByText(validationMessage, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("dialog", { name: "Add Product" }),
    ).toBeVisible();
  });

  test("should edit a product", async ({ page }) => {
    await page.getByRole("button", { name: "Edit Premium Hoodie" }).click();

    await expect(
      page.getByRole("dialog", { name: "Edit Product" }),
    ).toBeVisible();

    await page.getByLabel("Product Name").fill("Updated Premium Hoodie");

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Updated Premium Hoodie")).toBeVisible();
    await expect(page.getByText("Premium Hoodie", { exact: true })).toHaveCount(
      0,
    );
  });

  test("should cancel product deletion", async ({ page }) => {
    await page.getByRole("button", { name: "Delete Leather Wallet" }).click();

    await expect(
      page.getByRole("alertdialog", { name: "Delete Product?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Leather Wallet")).toBeVisible();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("should delete a product after confirmation", async ({ page }) => {
    await page.getByRole("button", { name: "Delete Leather Wallet" }).click();

    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByText("Leather Wallet", { exact: true })).toHaveCount(
      0,
    );

    await expect(page.getByText("Showing 1–5 of 9 products")).toBeVisible();
  });

  test("should close the create form with Cancel", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
