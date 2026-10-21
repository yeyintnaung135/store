import { test, expect } from "@playwright/test";

test.describe("Categories page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/categories");
  });

  test("displays the categories page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Shop by Category",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("displays all categories", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Electronics",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Fashion",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Accessories",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("displays a product count for every category", async ({ page }) => {
    await expect(page.getByText(/^\d+ products$/)).toHaveCount(3);

    await expect(page.getByText("17 products", { exact: true })).toHaveCount(2);
    await expect(page.getByText("16 products", { exact: true })).toHaveCount(1);
  });

  test("navigates to Electronics products", async ({ page }) => {
    const electronicsCard = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Electronics",
        exact: true,
      }),
    });

    await expect(electronicsCard).toHaveCount(1);

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
      page.getByRole("combobox", {
        name: "Filter by category",
      }),
    ).toHaveValue("Electronics");
  });

  test("shows the selected category when opening the products URL directly", async ({
    page,
  }) => {
    await page.goto("/products?category=Electronics");

    await expect(
      page.getByRole("combobox", {
        name: "Filter by category",
      }),
    ).toHaveValue("Electronics");
  });
});
