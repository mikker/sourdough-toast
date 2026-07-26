// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Sourdough Test");
});

test("a basic toast can render and then disappear after duration", async ({
  page,
}) => {
  await page.goto("/tests?duration=500");
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
  await page.goto("/tests?duration=1500");
  await page.getByRole("button", { name: "Basic" }).click();

  await page.hover("[data-sourdough-toast]");
  await page.waitForTimeout(2000);

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
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("persisted toast does not auto-dismiss", async ({ page }) => {
  await page.goto("/tests?duration=500");
  await page.getByRole("button", { name: "Persist", exact: true }).click();

  // Wait beyond the (shortened) duration
  await page.waitForTimeout(1000);

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

test("per-toast duration overrides the global duration", async ({ page }) => {
  await page.goto("/tests?duration=60000");

  await page.evaluate(() => window.toast("Quick toast", { duration: 500 }));

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("hovering pauses auto-dismiss and unhovering resumes it", async ({
  page,
}) => {
  await page.goto("/tests?duration=1500");
  await page.getByRole("button", { name: "Basic" }).click();

  await page.hover("[data-sourdough-toast]");
  await page.waitForTimeout(2000);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);

  // Unhover: the timer resumes and the toast dismisses
  await page.mouse.move(0, 0);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("toast() returns an id and toast.dismiss(id) removes the toast", async ({
  page,
}) => {
  const id = await page.evaluate(() => window.toast("Dismiss me"));
  expect(typeof id).toBe("string");

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);

  await page.evaluate((id) => window.toast.dismiss(id), id);
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);

  // Dismissing an unknown id must not throw
  await page.evaluate(() => window.toast.dismiss("no-such-id"));
});

test("global closeButton:true renders close buttons on toasts", async ({
  page,
}) => {
  await page.goto("/tests?closeButton=true");
  await page.getByRole("button", { name: "Basic" }).click();

  await expect(
    page.locator("[data-sourdough-toast] [data-close-button]"),
  ).toHaveCount(1);
});

test("per-toast closeButton:false overrides global closeButton:true", async ({
  page,
}) => {
  await page.goto("/tests?closeButton=true");
  await page.evaluate(() => window.toast("No close", { closeButton: false }));

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);
  await expect(
    page.locator("[data-sourdough-toast] [data-close-button]"),
  ).toHaveCount(0);
});

test("description without html:true renders markup as text", async ({
  page,
}) => {
  await page.evaluate(() =>
    window.toast.message({
      title: "Plain",
      description: "<strong>bold?</strong>",
    }),
  );

  const description = page.locator("[data-sourdough-toast] [data-description]");
  await expect(description).toHaveText("<strong>bold?</strong>");
  await expect(description.locator("strong")).toHaveCount(0);
});

test("oldest toast is the one evicted at maxToasts", async ({ page }) => {
  await page.evaluate(() => {
    window.toast("Toast 1");
    window.toast("Toast 2");
    window.toast("Toast 3");
    window.toast("Toast 4");
  });

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(3);
  await expect(page.getByText("Toast 1", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Toast 2", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Toast 4", { exact: true })).toHaveCount(1);
});

test("toasts have role=status and the list is labelled Notifications", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Basic" }).click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveAttribute(
    "role",
    "status",
  );
  await expect(page.locator("[data-sourdough-toaster]")).toHaveAttribute(
    "aria-label",
    "Notifications",
  );
});

test("Escape while the close button is focused dismisses the toast", async ({
  page,
}) => {
  await page.getByRole("button", { name: "With Close Button" }).click();
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(1);

  await page.locator("[data-close-button]").focus();
  await page.keyboard.press("Escape");

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("swiping a toast toward the screen edge dismisses it", async ({
  page,
}) => {
  await page.goto("/tests?duration=60000");
  await page.getByRole("button", { name: "Basic" }).click();

  const toast = page.locator("[data-sourdough-toast]");
  const box = await toast.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(x, y + (80 / 5) * i);
  }
  await page.mouse.up();

  await expect(toast).toHaveCount(0);
});

test("an abandoned swipe leaves the toast in place", async ({ page }) => {
  await page.goto("/tests?duration=60000");
  await page.getByRole("button", { name: "Basic" }).click();

  const toast = page.locator("[data-sourdough-toast]");
  const box = await toast.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  // Drag only 15px, slowly, so neither distance nor velocity dismisses
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 3; i++) {
    await page.mouse.move(x, y + 5 * i);
    await page.waitForTimeout(100);
  }
  await page.mouse.up();

  await expect(toast).toHaveCount(1);
  await expect(toast).toHaveAttribute("data-swiping", "false");
  const swipeAmount = await toast.evaluate((el) =>
    el.style.getPropertyValue("--swipe-amount"),
  );
  expect(swipeAmount).toBe("");
});

test("clicking a data-toast-dismiss button is not hijacked by swipe", async ({
  page,
}) => {
  await page.goto("/tests?duration=60000");
  await page.getByRole("button", { name: "With HTML" }).click();

  await page
    .locator("[data-sourdough-toast] [data-toast-dismiss]")
    .click();

  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(0);
});

test("persisted toasts don't count toward maxToasts", async ({ page }) => {
  await page.getByRole("button", { name: "Persist", exact: true }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();
  await page.getByRole("button", { name: "Basic" }).click();

  // 3 regular (maxToasts) + 1 persisted = 4 visible
  await expect(page.locator("[data-sourdough-toast]")).toHaveCount(4);
});
