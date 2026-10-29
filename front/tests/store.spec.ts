import { expect, test, type Page } from "@playwright/test";

const product = {
  name: "Wireless Headphones",
  price: "$17,500.00",
  lineTotalForTwo: "35,000 MMK",
};

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await resetApi(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("shows the catalog, navigation, and an empty cart", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart (0)" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
});

test("opens the about and contact pages from the navbar", async ({ page }) => {
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", { name: "Shopping made simple." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quality Products" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Explore Products" }).click();
  await expect(page).toHaveURL(/\/products$/);

  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { name: "How can we help?" }),
  ).toBeVisible();

  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByLabel("Subject").fill("Product question");
  await page.getByLabel("Message").fill("I would like to know more about shipping.");
  await page.getByRole("button", { name: "Send Message" }).click();

  await expect(
    page.getByRole("status"),
  ).toHaveText("Demo submitted successfully. No message has actually been sent.");
  await expect(page.getByLabel("Full name")).toHaveValue("");
});

test("adds a product, changes quantity, and clears the cart", async ({
  page,
}) => {
  await page
    .getByRole("link")
    .filter({ hasText: product.name })
    .click();

  await expect(page).toHaveURL(/\/products\/1$/);
  await expect(
    page.getByRole("heading", { name: product.name }),
  ).toBeVisible();
  await expect(page.getByText(product.price)).toBeVisible();

  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(
    page.getByRole("button", { name: "✓ Added to Cart" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible();

  await page.getByRole("link", { name: "Cart (1)" }).click();
  await expect(
    page.getByRole("heading", { name: "Shopping Cart" }),
  ).toBeVisible();
  await expect(page.getByText("17,500 MMK each")).toBeVisible();

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

test("removes a single product from the cart", async ({ page }) => {
  await page.goto("/products/1");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await page.getByRole("link", { name: "Cart (1)" }).click();

  await page
    .getByRole("button", { name: `Remove ${product.name} from cart` })
    .click();

  await expect(
    page.getByRole("heading", { name: "Your Cart Is Empty" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse Products" }),
  ).toHaveAttribute("href", "/products");
});

test("shows the not-found page for an unknown product", async ({ page }) => {
  await page.goto("/products/does-not-exist");

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
});
