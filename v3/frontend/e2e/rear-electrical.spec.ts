import { test, expect } from "@playwright/test";

test("rear electrical prototype appears in live preview and stays fixed during door motion", async ({
  page,
}) => {
  // Exercise the real geometry-only endpoint; full engineering verification is
  // covered by backend tests and the revision-bound quotation export check.
  await page.route("**/api/evaluate", (route) => route.abort());
  await page.goto("/");
  await page
    .getByRole("checkbox", { name: "Automatic verification" })
    .uncheck();
  const preview = page.waitForResponse(
    (r) => r.url().endsWith("/api/preview"),
    { timeout: 120000 },
  );
  await page
    .getByRole("spinbutton", { name: "Internal width", exact: true })
    .fill("1680");
  const response = await preview;
  expect(response.ok()).toBe(true);
  await expect(page.getByRole("status")).toContainText("Preview only", {
    timeout: 120000,
  });
  const data = await (
    await page.request.post("/api/preview", {
      data: { parameters: { width_mm: 1680 } },
    })
  ).json();
  const parts = data.model.parts.filter(
    (p: { assembly: string }) => p.assembly === "rear-electrical",
  );
  expect(parts.some((p: { id: string }) => p.id === "rear-controller")).toBe(
    true,
  );
  expect(
    parts.some((p: { id: string }) => p.id === "rear-pendant-cradle"),
  ).toBe(true);
  expect(parts.every((p: { motion_leaf?: string }) => !p.motion_leaf)).toBe(
    true,
  );
  expect(data.model.rear_electrical.cable_opening_mm).toBe(60);
  await page.getByRole("button", { name: "Design notes", exact: true }).click();
  await page.getByTestId("rear-electrical-note").locator("summary").click();
  await expect(page.getByTestId("rear-electrical-note")).toContainText(
    "retaining strap",
  );
  await expect(page.getByTestId("rear-electrical-note")).toContainText("60 mm");
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  await page
    .getByRole("slider", { name: "Rear wall · right bifold", exact: true })
    .fill("1");
  await page
    .getByRole("slider", { name: "Left wall · rear bifold", exact: true })
    .fill("1");
  await page.screenshot({
    path: "../artifacts/rear-electrical-preview.png",
    fullPage: true,
  });
});
