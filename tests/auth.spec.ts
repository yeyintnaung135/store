import { test, expect } from "@playwright/test";

test.describe("AuthForm - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should render login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await expect(
      page.getByLabel("Email or phone number", { exact: true }),
    ).toBeVisible();

    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show validation error for invalid email or phone", async ({
    page,
  }) => {
    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("invalid-input");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Enter a valid email address or phone number.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    const password = page.getByLabel("Password", { exact: true });

    await password.fill("password123");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("should accept email and show API-not-connected message", async ({
    page,
  }) => {
    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("user@example.com");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Validation passed. Login API is not connected yet.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should accept a phone number", async ({ page }) => {
    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("+959123456789");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Validation passed. Login API is not connected yet.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.getByRole("link", { name: "Create an account" }).click();

    await expect(page).toHaveURL(/\/register$/);

    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
  });
});

test.describe("AuthForm - Register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("should render registration fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();

    await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();

    await expect(
      page.getByLabel("Email or phone number", { exact: true }),
    ).toBeVisible();

    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await expect(
      page.getByLabel("Confirm password", { exact: true }),
    ).toBeVisible();
  });

  test("should reject passwords that do not match", async ({ page }) => {
    await page.getByLabel("Full name", { exact: true }).fill("Test User");

    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("user@example.com");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("different123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText("Passwords do not match.", { exact: true }),
    ).toBeVisible();
  });

  test("should accept matching passwords and show demo status", async ({
    page,
  }) => {
    await page.getByLabel("Full name", { exact: true }).fill("Test User");

    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("user@example.com");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("password123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText(
        "Validation passed. Registration API is not connected yet.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("should accept a phone number during registration", async ({ page }) => {
    await page.getByLabel("Full name", { exact: true }).fill("Test User");

    await page
      .getByLabel("Email or phone number", { exact: true })
      .fill("+959123456789");

    await page.getByLabel("Password", { exact: true }).fill("password123");

    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("password123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText(
        "Validation passed. Registration API is not connected yet.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("should navigate back to login page", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in instead" }).click();

    await expect(page).toHaveURL(/\/login$/);

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
