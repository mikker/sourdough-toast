// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/tests");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Sourdough Test");
});

test("a basic toast can render and then disappear after duration", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Basic" }).click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("only renders max toasts", async ({ page }) => {
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(3);
});

test("toast have types", async ({ page }) => {
  await page.getByRole("button", { name: "Success" }).click();
  await expect(page.getByText("Success toast", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Error" }).click();
  await expect(page.getByText("Error toast", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Warning" }).click();
  await expect(page.getByText("Warning toast", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Info" }).click();
  await expect(page.getByText("Info toast", { exact: true })).toHaveCount(1);
});

test("toasts don't dismiss when hovered", async ({ page }) => {
  await page.getByRole("button", { name: "Basic" }).click();

  await page.hover("[data-sourdough-toast]");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);
});

test("toast with closeButton:true renders a close button", async ({ page }) => {
  await page.getByRole("button", { name: "With Close Button" }).click();
  await expect(page.locator("[data-close-button]")).toHaveCount(1);
});

test("clicking close button removes the toast", async ({ page }) => {
  await page.getByRole("button", { name: "With Close Button" }).click();
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);

  await page.locator("[data-close-button]").click();

  await expect(page.locator("[data-sourdough-toast][data-removed='true']")).toBeVisible();

  await page.waitForTimeout(500);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});
