import { test, expect, type Page } from "@playwright/test";

const CART_STORAGE_KEY = "mm-store-cart";

async function seedCart(page: Page) {
  // Open the application first so localStorage is available.
  await page.goto("/checkout");

  // Seed the cart using the same key and structure as CartContext.
  await page.evaluate((storageKey) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        items: [
          {
            id: 1,
            name: "Test Product",
            price: 10000,
            quantity: 2,
          },
        ],
      }),
    );
  }, CART_STORAGE_KEY);

  // Reload so CartProvider restores the seeded cart.
  await page.reload();

  // Wait until the cart has been restored before continuing.
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByText("Test Product", { exact: true })).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByLabel("Full name")).toBeVisible({
    timeout: 10000,
  });
}

async function fillValidCheckoutForm(page: Page) {
  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Phone number").fill("09123456789");

  await page
    .getByLabel("Email address (optional)")
    .fill("customer@example.com");

  await page
    .getByLabel("Street address / Township")
    .fill("No. 12, Test Street");

  await page.getByLabel("City / Region").fill("Yangon");

  await page
    .getByLabel("Delivery notes (optional)")
    .fill("Call before delivery");
}

test.describe("Checkout Page", () => {
  test("should show empty cart message when cart is empty", async ({
    page,
  }) => {
    // Start with a clean cart for this test.
    await page.goto("/checkout");
    await page.evaluate((storageKey) => {
      localStorage.removeItem(storageKey);
    }, CART_STORAGE_KEY);
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Browse Products" }),
    ).toHaveAttribute("href", "/products");
  });

  test("should display checkout form and order summary", async ({ page }) => {
    await seedCart(page);

    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Phone number")).toBeVisible();
    await expect(page.getByLabel("Email address (optional)")).toBeVisible();
    await expect(page.getByLabel("Street address / Township")).toBeVisible();
    await expect(page.getByLabel("City / Region")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Order Summary" }),
    ).toBeVisible();

    await expect(page.getByText("Test Product", { exact: true })).toBeVisible();

    // Item subtotal and order total both display 20,000 MMK.
    await expect(page.getByText("20,000 MMK", { exact: true })).toHaveCount(2);

    await expect(
      page.getByRole("button", { name: "Place Order" }),
    ).toBeVisible();
  });

  test("should mark required fields as required", async ({ page }) => {
    await seedCart(page);

    await expect(page.getByLabel("Full name")).toHaveAttribute("required", "");

    await expect(page.getByLabel("Phone number")).toHaveAttribute(
      "required",
      "",
    );

    await expect(page.getByLabel("Street address / Township")).toHaveAttribute(
      "required",
      "",
    );

    await expect(page.getByLabel("City / Region")).toHaveAttribute(
      "required",
      "",
    );
  });

  test("should reject an invalid phone number", async ({ page }) => {
    await seedCart(page);

    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Phone number").fill("abc");

    await page
      .getByLabel("Street address / Township")
      .fill("No. 12, Test Street");

    await page.getByLabel("City / Region").fill("Yangon");

    await page.getByRole("button", { name: "Place Order" }).click();

    // The order must not be submitted with an invalid phone number.
    await expect(page.getByText("Test Product", { exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    await expect(page.getByLabel("Phone number")).toHaveValue("abc");
  });

  test("should reject an empty phone number", async ({ page }) => {
    await seedCart(page);

    await page.getByLabel("Full name").fill("Test Customer");

    await page
      .getByLabel("Street address / Township")
      .fill("No. 12, Test Street");

    await page.getByLabel("City / Region").fill("Yangon");

    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    await expect(page.getByLabel("Phone number")).toHaveValue("");
  });

  test("should accept valid checkout form fields", async ({ page }) => {
    await seedCart(page);
    await fillValidCheckoutForm(page);

    await expect(page.getByLabel("Full name")).toHaveValue("Test Customer");
    await expect(page.getByLabel("Phone number")).toHaveValue("09123456789");
    await expect(page.getByLabel("Email address (optional)")).toHaveValue(
      "customer@example.com",
    );
    await expect(page.getByLabel("City / Region")).toHaveValue("Yangon");
  });
});
