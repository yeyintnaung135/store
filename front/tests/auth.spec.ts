import { expect, test, type Page } from "@playwright/test";

async function resetApi(page: Page) {
  const response = await page.request.post("http://127.0.0.1:4010/__reset");
  expect(response.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await resetApi(page);
});

test.describe("AuthForm - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email or phone number")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveAttribute("minlength", "8");
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveAttribute("maxlength", "72");
  });

  test("rejects an identifier that is not an email or phone", async ({
    page,
  }) => {
    await page.getByLabel("Email or phone number").fill("invalid-input");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText(
        "Enter a valid email address or phone number with country code, e.g. +959123456789.",
      ),
    ).toBeVisible();
  });

  test("toggles password visibility", async ({ page }) => {
    const password = page.getByRole("textbox", { name: "Password", exact: true });
    await password.fill("password123");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("shows an error when the API rejects the password", async ({ page }) => {
    await page.getByLabel("Email or phone number").fill("user@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signs in a customer and returns to the store", async ({ page }) => {
    await page.getByLabel("Email or phone number").fill("user@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("accepts a phone number and signs in", async ({ page }) => {
    await page.getByLabel("Email or phone number").fill("+959123456789");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("sends an admin to the dashboard", async ({ page }) => {
    await page.getByLabel("Email or phone number").fill("admin@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("navigates to the register page", async ({ page }) => {
    await page.getByRole("link", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
  });

  test("sends a guest away from the admin area", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });
});

test.describe("AuthForm - Register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders the registration fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email or phone number")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });

  test("rejects passwords that do not match", async ({ page }) => {
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email or phone number").fill("user@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("different123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("creates an account and returns to login", async ({ page }) => {
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email or phone number").fill("user@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("accepts a phone number during registration", async ({ page }) => {
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email or phone number").fill("+959123456789");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("navigates back to the login page", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });
});
