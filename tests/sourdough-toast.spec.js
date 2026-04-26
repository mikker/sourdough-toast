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

  await page.getByRole("button", { name: "Error", exact: true }).click();
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

  await expect(
    page.locator("[data-sourdough-toast][data-removed='true']"),
  ).toBeVisible();

  await page.waitForTimeout(500);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("render html in toast description and data-toast-dismiss works", async ({
  page,
}) => {
  await page.getByRole("button", { name: "With HTML" }).click();

  const description = await page.waitForSelector(
    "[data-sourdough-toast] [data-description]",
  );
  const dismissButton = await description.$("[data-toast-dismiss]");
  expect(dismissButton).not.toBeNull();
  expect(await dismissButton.textContent()).toBe("Confirm");
  await dismissButton.click();
  await page.waitForSelector("[data-sourdough-toast][data-removed='true']");
  await page.waitForTimeout(500);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("persisted toast does not auto-dismiss", async ({ page }) => {
  await page.getByRole("button", { name: "Persist", exact: true }).click();

  // Wait beyond the default duration (4s)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);
});

test("persisted toast has close button", async ({ page }) => {
  await page.getByRole("button", { name: "Persist", exact: true }).click();

  await expect(
    page.locator("[data-sourdough-toast] [data-close-button]"),
  ).toHaveCount(1);
});

test("persisted toast can be dismissed via close button", async ({ page }) => {
  await page.getByRole("button", { name: "Persist", exact: true }).click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);

  await page.locator("[data-close-button]").click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("persisted toasts stack normally with regular toasts", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Persist", exact: true }).click();

  const toasts = page.locator("[data-sourdough-toast]");
  await expect(toasts).toHaveCount(2);

  // Persisted toast is second (created after basic), so it gets the higher z-index
  const regularZIndex = await toasts
    .filter({ hasNotText: "Persistent toast" })
    .evaluate((el) => el.style.getPropertyValue("--z-index"));
  const persistedZIndex = await toasts
    .filter({ hasText: "Persistent toast" })
    .evaluate((el) => el.style.getPropertyValue("--z-index"));

  expect(Number(persistedZIndex)).toBeGreaterThan(Number(regularZIndex));
});

test("persisted toasts don't count toward maxToasts", async ({ page }) => {
  await page.getByRole("button", { name: "Persist", exact: true }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();

  // 3 regular (maxToasts) + 1 persisted = 4 visible
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(4);
});
