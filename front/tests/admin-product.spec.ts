import { expect, test, type Page } from "@playwright/test";

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

async function openProducts(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "admin-token");
  });
  await page.goto("/admin/products");
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Wireless Headphones")).toBeVisible();
}

test.describe("Admin products", () => {
  test.beforeEach(async ({ page }) => {
    await resetApi(page);
    await openProducts(page);
  });

  test("shows the catalog summary", async ({ page }) => {
    await expect(page.getByRole("button", { name: "+ Add Product" })).toBeVisible();
    await expect(page.getByText("Total Products")).toBeVisible();
    await expect(page.getByText("Active Products on Page")).toBeVisible();
    await expect(page.getByText("Low Stock on Page (5 or fewer)")).toBeVisible();
    await expect(page.getByText("Showing 1–5 of 12 products")).toBeVisible();
    await expect(page.getByText("Cotton T-Shirt")).toBeVisible();
  });

  test("searches products by name", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search products" }).fill("headphones");

    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    await expect(page.getByText("Cotton T-Shirt")).toHaveCount(0);
    await expect(page.getByText("Showing 1–1 of 1 products")).toBeVisible();
  });

  test("shows an empty state when nothing matches", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("product-does-not-exist");

    await expect(
      page.getByText("No products found. Try another search or category."),
    ).toBeVisible();
    await expect(page.getByText("Showing 0 products")).toBeVisible();
  });

  test("filters products by category", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by category" })
      .selectOption({ label: "Electronics" });

    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    await expect(page.getByText("Travel Backpack")).toBeVisible();
    await expect(page.getByText("Smart Watch")).toHaveCount(0);
    await expect(page.getByText("Showing 1–4 of 4 products")).toBeVisible();
  });

  test("paginates products", async ({ page }) => {
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText("Showing 6–10 of 12 products")).toBeVisible();
    await expect(page.getByText("Bluetooth Speaker")).toBeVisible();
    await expect(page.getByText("Wireless Headphones")).toHaveCount(0);

    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByText("Showing 1–5 of 12 products")).toBeVisible();
  });

  test("validates the product form", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();
    const dialog = page.getByRole("dialog", { name: "Add Product" });

    await dialog.getByLabel("Product Name").fill("Invalid Product");
    await dialog.getByLabel("Price (MMK)").fill("-100");
    await dialog.getByLabel("Stock").fill("-5");
    await dialog.getByRole("button", { name: "Create Product" }).click();

    await expect(dialog.getByRole("alert")).toHaveText(
      "Enter a product name, a valid positive price, and a whole-number stock of zero or more.",
    );
  });

  test("creates a product", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();
    const dialog = page.getByRole("dialog", { name: "Add Product" });

    await dialog.getByLabel("Product Name").fill("Test Keyboard");
    await dialog.getByLabel("Category", { exact: true }).selectOption({
      label: "Electronics",
    });
    await dialog.getByLabel("Price (MMK)").fill("50000");
    await dialog.getByLabel("Stock").fill("10");
    await dialog.getByLabel("Status", { exact: true }).selectOption("Active");
    await dialog.getByRole("button", { name: "Create Product" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText(
      "Product created successfully.",
    );
    await expect(page.getByText("Test Keyboard")).toBeVisible();
    await expect(page.getByText("50,000 MMK")).toBeVisible();
  });

  test("edits a product", async ({ page }) => {
    await page.getByRole("button", { name: "Edit Wireless Headphones" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Product" });

    await dialog.getByLabel("Product Name").fill("Updated Headphones");
    await dialog.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Product updated successfully.",
    );
    await expect(page.getByText("Updated Headphones")).toBeVisible();
    await expect(page.getByText("Wireless Headphones", { exact: true })).toHaveCount(
      0,
    );
  });

  test("cancels product deletion", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("Leather Wallet");
    await page.getByRole("button", { name: "Delete Leather Wallet" }).click();

    const alertDialog = page.getByRole("alertdialog", { name: "Delete Product?" });
    await expect(alertDialog).toBeVisible();
    await alertDialog.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Leather Wallet")).toBeVisible();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("deletes a product after confirmation", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill("Leather Wallet");
    await page.getByRole("button", { name: "Delete Leather Wallet" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByRole("status")).toHaveText(
      "Product deleted successfully.",
    );
    await expect(page.getByText("Leather Wallet", { exact: true })).toHaveCount(0);
  });

  test("closes the create form with Cancel", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Product" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("starts a product export", async ({ page }) => {
    await page.goto("/admin/products/export");

    await expect(
      page.getByRole("heading", { name: "Export Products" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Export to Excel" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Export job added to the queue.",
    );
    await expect(page.getByText("Export completed.")).toBeVisible();
    await expect(page.getByText("job-1")).toBeVisible();
  });

  test("moves between admin sections", async ({ page }) => {
    await page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", {
      name: "Overview",
    }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("1,250,000 MMK")).toBeVisible();
    await expect(page.getByText("ORD-001")).toBeVisible();
  });
});
