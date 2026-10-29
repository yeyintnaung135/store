import { expect, test, type Page } from "@playwright/test";

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

async function openAdminCategories(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "admin-token");
  });
  await page.goto("/admin/categories");
  await expect(
    page.getByRole("heading", { name: "Categories", exact: true }),
  ).toBeVisible();
}

test.describe("Store categories", () => {
  test.beforeEach(async ({ page }) => {
    await resetApi(page);
    await page.goto("/categories");
  });

  test("displays the categories page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Shop by Category", exact: true }),
    ).toBeVisible();
  });

  test("displays all categories", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Electronics", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Fashion", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Accessories", exact: true }),
    ).toBeVisible();
  });

  test("displays a product count for every category", async ({ page }) => {
    await expect(page.getByText(/^\d+ products$/)).toHaveCount(3);
    await expect(page.getByText("17 products", { exact: true })).toHaveCount(2);
    await expect(page.getByText("16 products", { exact: true })).toHaveCount(1);
  });

  test("opens the product catalog from a category card", async ({ page }) => {
    const electronicsCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: "Electronics", exact: true }),
    });

    const browseLink = electronicsCard.getByRole("link", {
      name: /browse products/i,
    });

    await expect(browseLink).toHaveAttribute(
      "href",
      "/products?category=Electronics",
    );

    await browseLink.click();

    await expect(page).toHaveURL(/\/products\?category=Electronics$/);
    await expect(
      page.getByRole("searchbox", { name: "Search products" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Wireless Headphones" }),
    ).toBeVisible();
  });
});

test.describe("Admin categories", () => {
  test.beforeEach(async ({ page }) => {
    await resetApi(page);
    await openAdminCategories(page);
  });

  test("lists categories from the API", async ({ page }) => {
    await expect(page.getByText("Total Categories")).toBeVisible();
    await expect(page.getByText("Electronics", { exact: true })).toBeVisible();
    await expect(page.getByText("electronics", { exact: true })).toBeVisible();
    await expect(page.getByText("Fashion", { exact: true })).toBeVisible();
    await expect(page.getByText("Accessories", { exact: true })).toBeVisible();
  });

  test("searches categories and shows an empty state", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search categories" }).fill("fashion");

    await expect(page.getByText("Fashion", { exact: true })).toBeVisible();
    await expect(page.getByText("Electronics", { exact: true })).toHaveCount(0);

    await page
      .getByRole("searchbox", { name: "Search categories" })
      .fill("missing-category");

    await expect(page.getByText("No categories found")).toBeVisible();
  });

  test("creates a category", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Category" }).click();

    const dialog = page.getByRole("dialog", { name: "Create Category" });
    await dialog.getByLabel("Category Name *").fill("Home Goods");
    await expect(dialog.getByLabel("Slug *")).toHaveValue("home-goods");
    await dialog.getByRole("button", { name: "Create Category" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Category အသစ်ထည့်ပြီးပါပြီ။",
    );
    await expect(page.getByText("Home Goods")).toBeVisible();
    await expect(page.getByText("home-goods")).toBeVisible();
  });

  test("rejects a blank category name", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Category" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Category" });

    await dialog.getByLabel("Category Name *").fill("   ");
    await dialog.getByLabel("Slug *").fill("blank");
    await dialog.getByRole("button", { name: "Create Category" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("Category name ထည့်ပေးပါ။");
  });

  test("edits a category", async ({ page }) => {
    const row = page.getByRole("row").filter({ hasText: "Fashion" });
    await row.getByRole("button", { name: "Edit" }).click();

    const dialog = page.getByRole("dialog", { name: "Edit Category" });
    await dialog.getByLabel("Category Name *").fill("Apparel");
    await dialog.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Category ကို ပြင်ဆင်ပြီးပါပြီ။",
    );
    await expect(page.getByText("Apparel")).toBeVisible();
  });

  test("cancels category creation", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Category" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("deletes a category after confirmation", async ({ page }) => {
    page.once("dialog", (dialog) => dialog.accept());

    const row = page.getByRole("row").filter({ hasText: "Accessories" });
    await row.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Category ကို ဖျက်ပြီးပါပြီ။",
    );
    await expect(page.getByText("Accessories")).toHaveCount(0);
  });
});
