import { expect, test } from "@playwright/test";

test.describe("Admin Users", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("accessToken", "admin-token");
    });
    await page.goto("/admin/users");
  });

  test("should display the users page and summary cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Users Management" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "All Users" }),
    ).toBeVisible();

    const summary = page.getByRole("region", { name: "User summary" });
    await expect(
      summary.getByText("Total Users", { exact: true }),
    ).toBeVisible();
    await expect(
      summary.getByText("Active Users", { exact: true }),
    ).toBeVisible();
    await expect(
      summary.getByText("Inactive Users", { exact: true }),
    ).toBeVisible();
    await expect(
      summary.getByText("Administrators", { exact: true }),
    ).toBeVisible();

    await expect(summary.getByText("12", { exact: true })).toBeVisible();
    await expect(summary.getByText("9", { exact: true })).toBeVisible();
    await expect(summary.getByText("3", { exact: true })).toBeVisible();
    await expect(summary.getByText("2", { exact: true })).toBeVisible();

    await expect(page.getByText("USR-001")).toBeVisible();
    await expect(page.getByText("Mg Mg")).toBeVisible();
    await expect(page.getByText("Showing 1–5 of 12 users")).toBeVisible();
  });

  test("should search users by name", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search users" }).fill("Aye Aye");

    await expect(
      page.getByRole("cell", { name: "USR-002", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "USR-001", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("Showing 1–1 of 1 users")).toBeVisible();
  });

  test("should search users by email", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search users" })
      .fill("susu@example.com");

    await expect(page.getByText("USR-004")).toBeVisible();
    await expect(page.getByText("Su Su")).toBeVisible();
    await expect(page.getByText("USR-001")).toHaveCount(0);
  });

  test("should search users by user ID", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search users" }).fill("USR-003");

    await expect(page.getByText("Ko Ko")).toBeVisible();
    await expect(page.getByText("USR-001")).toHaveCount(0);
  });

  test("should show an empty state when no users match", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search users" })
      .fill("no-matching-user");

    await expect(page.getByText("No users found")).toBeVisible();
    await expect(
      page.getByText("Try changing your search or filter criteria."),
    ).toBeVisible();
    await expect(page.getByText("Showing 0–0 of 0 users")).toBeVisible();
  });

  test("should filter users by role", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by role" })
      .selectOption("Admin");

    await expect(page.getByText("USR-001")).toBeVisible();
    await expect(page.getByText("USR-006")).toBeVisible();
    await expect(page.getByText("USR-002")).toHaveCount(0);
    await expect(page.getByText("Showing 1–2 of 2 users")).toBeVisible();
  });

  test("should filter users by status", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by status" })
      .selectOption("Inactive");

    await expect(page.getByText("USR-003")).toBeVisible();
    await expect(page.getByText("USR-007")).toBeVisible();
    await expect(page.getByText("USR-010")).toBeVisible();
    await expect(page.getByText("USR-001")).toHaveCount(0);
    await expect(page.getByText("Showing 1–3 of 3 users")).toBeVisible();
  });

  test("should reset filters", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search users" }).fill("Aye Aye");
    await expect(page.getByText("Showing 1–1 of 1 users")).toBeVisible();

    await page.getByRole("button", { name: "Reset Filters" }).click();

    await expect(
      page.getByRole("searchbox", { name: "Search users" }),
    ).toHaveValue("");
    await expect(page.getByText("Showing 1–5 of 12 users")).toBeVisible();
    await expect(page.getByText("USR-001")).toBeVisible();
  });

  test("should clear filters from the empty state", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search users" })
      .fill("no-matching-user");

    await page.getByRole("button", { name: "Clear Filters" }).click();

    await expect(page.getByText("Showing 1–5 of 12 users")).toBeVisible();
    await expect(page.getByText("USR-001")).toBeVisible();
  });

  test("should paginate users", async ({ page }) => {
    await expect(page.getByText("Showing 1–5 of 12 users")).toBeVisible();
    await expect(page.getByText("Page 1 of 3")).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText("Showing 6–10 of 12 users")).toBeVisible();
    await expect(page.getByText("USR-006")).toBeVisible();
    await expect(page.getByText("USR-001")).toHaveCount(0);

    await page.getByRole("button", { name: "Go to page 3" }).click();

    await expect(page.getByText("Showing 11–12 of 12 users")).toBeVisible();
    await expect(page.getByText("USR-011")).toBeVisible();
    await expect(page.getByText("USR-012")).toBeVisible();

    await page.getByRole("button", { name: "Previous", exact: true }).click();

    await expect(page.getByText("Showing 6–10 of 12 users")).toBeVisible();
  });

  test("should open and close user details", async ({ page }) => {
    await page.getByRole("button", { name: "View USR-001" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "User Details" }),
    ).toBeVisible();
    await expect(dialog.getByText("mgmg@example.com")).toBeVisible();
    await expect(dialog.getByText("09-123456789")).toBeVisible();
    await expect(dialog.getByText("Yangon, Myanmar")).toBeVisible();
    await expect(dialog.getByText("850,000 MMK")).toBeVisible();
    await expect(dialog.getByText("12", { exact: true })).toBeVisible();

    await dialog.getByRole("button", { name: "Close user details" }).click();

    await expect(dialog).toHaveCount(0);
  });

  test("should deactivate a user from the table", async ({ page }) => {
    const row = page.getByRole("row").filter({ hasText: "USR-001" });

    await row.getByRole("button", { name: "Deactivate USR-001" }).click();

    await expect(row.getByText("Inactive")).toBeVisible();

    const summary = page.getByRole("region", { name: "User summary" });
    const activeCard = summary.getByRole("article").filter({
      hasText: "Active Users",
    });
    const inactiveCard = summary.getByRole("article").filter({
      hasText: "Inactive Users",
    });

    await expect(activeCard.getByText("8", { exact: true })).toBeVisible();
    await expect(inactiveCard.getByText("4", { exact: true })).toBeVisible();
  });

  test("should activate an inactive user from the details dialog", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "View USR-003" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Activate USR-003" }).click();

    await expect(dialog.getByText("Active")).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();

    const row = page.getByRole("row").filter({ hasText: "USR-003" });
    await expect(row.getByText("Active")).toBeVisible();
    await expect(
      row.getByRole("button", { name: "Deactivate USR-003" }),
    ).toBeVisible();
  });
});
