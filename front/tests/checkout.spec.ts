import { expect, test, type Page } from "@playwright/test";

const CART_STORAGE_KEY = "mm-store-cart";

const cartPayload = JSON.stringify({
  items: [
    {
      id: 1,
      name: "Test Product",
      price: 10000,
      quantity: 2,
    },
  ],
});

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

async function openCheckout(page: Page, options?: { signedIn?: boolean }) {
  await page.addInitScript(
    ({ storageKey, cart, signedIn }) => {
      localStorage.setItem(storageKey, cart);
      if (signedIn) {
        localStorage.setItem("accessToken", "customer-token");
      }
    },
    {
      storageKey: CART_STORAGE_KEY,
      cart: cartPayload,
      signedIn: Boolean(options?.signedIn),
    },
  );

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await resetApi(page);
});

test.describe("Checkout page", () => {
  test("shows an empty cart message when the cart is empty", async ({
    page,
  }) => {
    await page.goto("/checkout");

    await expect(
      page.getByRole("heading", { name: "Your Cart Is Empty" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Products" }),
    ).toHaveAttribute("href", "/products");
  });

  test("shows the order summary and asks a guest to log in", async ({
    page,
  }) => {
    await openCheckout(page);

    await expect(page.getByRole("heading", { name: "Your Items" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByText("Test Product", { exact: true })).toBeVisible();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Login ဝင်ပါ" })).toHaveAttribute(
      "href",
      "/login?redirect=/checkout",
    );

    const placeOrder = page.getByRole("button", { name: /Place Order/ });
    await expect(placeOrder).toBeDisabled();
    await expect(placeOrder).toContainText("$20,000.00");
  });

  test("returns to the cart", async ({ page }) => {
    await openCheckout(page);
    await page.getByRole("link", { name: "← Back to Cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByRole("heading", { name: "Shopping Cart" }),
    ).toBeVisible();
  });

  test("places an order for a signed-in customer", async ({ page }) => {
    await openCheckout(page, { signedIn: true });

    const placeOrder = page.getByRole("button", { name: /Place Order/ });
    await expect(placeOrder).toBeEnabled();
    await placeOrder.click();

    await expect(
      page.getByRole("heading", { name: "Order Created Successfully!" }),
    ).toBeVisible();
    await expect(page.getByText("ORD-E2E-001")).toBeVisible();
    await expect(page.getByText("PENDING")).toBeVisible();
    await expect(page.getByRole("link", { name: "My Orders" })).toHaveAttribute(
      "href",
      "/orders",
    );

    await page.getByRole("link", { name: "Cart (0)" }).click();
    await expect(
      page.getByRole("heading", { name: "Your Cart Is Empty" }),
    ).toBeVisible();
  });
});
