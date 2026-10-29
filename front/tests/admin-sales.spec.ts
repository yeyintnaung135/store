import { expect, test, type Locator } from "@playwright/test";

async function fillDate(input: Locator, value: string) {
  await expect
    .poll(() =>
      input.evaluate((element) =>
        Object.getOwnPropertyNames(element).some((key) =>
          key.startsWith("__reactProps$"),
        ),
      ),
    )
    .toBe(true);

  await input.evaluate((element, nextValue) => {
    const dateInput = element as HTMLInputElement;
    const propsKey = Object.getOwnPropertyNames(dateInput).find((key) =>
      key.startsWith("__reactProps$"),
    );
    const onChange = propsKey
      ? (
          dateInput as unknown as Record<
            string,
            { onChange?: (event: { target: { value: string } }) => void }
          >
        )[propsKey]?.onChange
      : undefined;

    onChange?.({ target: { value: nextValue } });
  }, value);
}

test.describe("Admin Sales", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("accessToken", "admin-token");
    });
    await page.goto("/admin/sales");
  });

  test("should display the sales page and summary cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Sales", exact: true }),
    ).toBeVisible();

    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Total Sales", { exact: true })).toBeVisible();
    await expect(page.getByText("Average Order Value")).toBeVisible();
    await expect(page.getByText("Pending Payments")).toBeVisible();

    await expect(page.getByText("SALE-001")).toBeVisible();
    await expect(page.getByText("Mg Mg")).toBeVisible();
  });

  test("should search sales by customer name", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search sales" }).fill("Aye Aye");

    await expect(page.getByText("SALE-002")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);
    await expect(page.getByText("Showing 1–1 of 1 sales")).toBeVisible();
  });

  test("should search sales by sale ID", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search sales" }).fill("SALE-003");

    await expect(page.getByText("Ko Ko")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);
  });

  test("should search sales by order ID", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search sales" })
      .fill("ORD-20261021-003");

    await expect(page.getByText("Ko Ko")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);
  });

  test("should search sales by customer email", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search sales" })
      .fill("susu@example.com");

    await expect(page.getByText("SALE-004")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);
  });

  test("should show an empty state when no sales match", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search sales" })
      .fill("no-matching-sale");

    await expect(
      page.getByText("No sales found. Try another search or filter.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByText("Showing 0–0 of 0 sales")).toBeVisible();
  });

  test("should filter sales by status", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Filter by sale status" })
      .selectOption("Pending");

    await expect(page.getByText("SALE-002")).toBeVisible();
    await expect(page.getByText("SALE-006")).toBeVisible();
    await expect(page.getByText("SALE-010")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);

    await expect(page.getByText("Showing 1–3 of 3 sales")).toBeVisible();
  });

  test("should filter sales by start date", async ({ page }) => {
    await fillDate(page.getByLabel("Start date"), "2026-10-21");

    await expect(page.getByText("SALE-001")).toBeVisible();
    await expect(page.getByText("SALE-002")).toBeVisible();
    await expect(page.getByText("SALE-003")).toBeVisible();
    await expect(page.getByText("SALE-004")).toHaveCount(0);
    await expect(page.getByText("Showing 1–3 of 3 sales")).toBeVisible();
  });

  test("should filter sales by end date", async ({ page }) => {
    await fillDate(page.getByLabel("End date"), "2026-10-16");

    await expect(page.getByText("SALE-008")).toBeVisible();
    await expect(page.getByText("SALE-009")).toBeVisible();
    await expect(page.getByText("SALE-010")).toBeVisible();
    await expect(page.getByText("SALE-001")).toHaveCount(0);
    await expect(page.getByText("Showing 1–3 of 3 sales")).toBeVisible();
  });

  test("should paginate sales", async ({ page }) => {
    await expect(page.getByText("Showing 1–5 of 10 sales")).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText("Showing 6–10 of 10 sales")).toBeVisible();
    await expect(page.getByText("SALE-006")).toBeVisible();

    await page.getByRole("button", { name: "Previous", exact: true }).click();

    await expect(page.getByText("Showing 1–5 of 10 sales")).toBeVisible();
  });

  test("should open sale details", async ({ page }) => {
    await page.getByRole("button", { name: "View SALE-001" }).click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Sale Details" }),
    ).toBeVisible();

    await expect(dialog.getByText("SALE-001")).toBeVisible();
    await expect(dialog.getByText("ORD-20261022-001")).toBeVisible();
    await expect(dialog.getByText("mgmg@example.com")).toBeVisible();
    await expect(dialog.getByText("90,000 MMK")).toBeVisible();
  });

  test("should close sale details", async ({ page }) => {
    await page.getByRole("button", { name: "View SALE-001" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Close sale details" }).click();

    await expect(dialog).toHaveCount(0);
  });

  test("should update sale status", async ({ page }) => {
    await page.getByRole("button", { name: "View SALE-002" }).click();

    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Sale Status").selectOption("Completed");
    await dialog.getByRole("button", { name: "Done" }).click();

    const saleRow = page.getByRole("row").filter({
      hasText: "SALE-002",
    });

    await expect(saleRow.getByText("Completed")).toBeVisible();
  });

  test("should update revenue after completing a pending sale", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "View SALE-002" }).click();

    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Sale Status").selectOption("Completed");
    await dialog.getByRole("button", { name: "Done" }).click();

    // Confirm the sale status changed successfully.
    const saleRow = page.getByRole("row").filter({
      hasText: "SALE-002",
    });

    await expect(saleRow.getByText("Completed")).toBeVisible();

    // Verify the revenue card updates without assuming a total amount.
    const revenueCard = page
      .locator("div.rounded-xl")
      .filter({ hasText: "Total Revenue" })
      .first();

    await expect(revenueCard).toBeVisible();
    await expect(revenueCard.locator("p").nth(1)).not.toHaveText("650,000 MMK");
  });

  test("should print the sales report", async ({ page }) => {
    await page.evaluate(() => {
      window.print = () => {};
    });

    await page.getByRole("button", { name: "Print Report" }).click();
  });
});
