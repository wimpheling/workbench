import { test, expect } from "@playwright/test";
test("actual enclosure evaluates, moves doors, exports and rejects bad dimensions", async ({
  page,
}) => {
  const errors: string[] = [];
  let verificationRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/evaluate")) verificationRequests++;
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Design needs correction", {
    timeout: 120000,
  });
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: "../artifacts/enclosure-desktop.png",
    fullPage: true,
  });
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Clearances", exact: true }).check();
  for (const [label, opening] of [
    ["Front · right leaf", "1"],
    ["Front · left leaf", "0.6"],
    ["Left wall · rear bifold", "0.6"],
    ["Rear wall · right bifold", "0.6"],
  ]) {
    await page.getByRole("slider", { name: label }).fill(opening);
    // Pose motion is rendered from canonical meshes in the browser; slider
    // frames must not queue a native CAD request.
    await expect(page.getByRole("status")).toContainText("Design needs correction", {
      timeout: 120000,
    });
  }
  const callsBeforePlayback = verificationRequests;
  await page.getByRole("button", { name: "Play opening sequence" }).click();
  await page.waitForTimeout(250);
  expect(verificationRequests).toBe(callsBeforePlayback);
  await page.getByRole("button", { name: "Play closing sequence" }).click();
  await page.waitForTimeout(250);
  expect(verificationRequests).toBe(callsBeforePlayback);
  await page.getByRole("checkbox", { name: "Automatic verification" }).uncheck();
  const verifiedBeforePreview = verificationRequests;
  const previewResponse = page.waitForResponse((r) => r.url().endsWith("/api/preview"));
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1680");
  const preview = await previewResponse;
  expect(preview.ok()).toBe(true);
  const previewRevision = preview.headers()["x-design-revision"];
  expect(previewRevision).toMatch(/^[a-f0-9]{16}$/);
  expect(preview.headers()["x-verification-state"]).toBe("preview");
  await expect(page.getByRole("status")).toContainText("Preview only", {
    timeout: 120000,
  });
  expect(verificationRequests).toBe(verifiedBeforePreview);
  await page.getByRole("button", { name: "Supplier files", exact: true }).click();
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
  const manualResponse = page.waitForResponse((r) => r.url().endsWith("/api/evaluate"));
  await page.getByRole("button", { name: "Verify now", exact: true }).click();
  const manual = await manualResponse;
  expect(manual.ok()).toBe(true);
  expect(manual.headers()["x-design-revision"]).toBe(previewRevision);
  expect(manual.headers()["x-verification-state"]).toBe("evaluated");
  await expect(page.getByRole("status")).toContainText("Design needs correction", {
    timeout: 120000,
  });
  await expect(page.getByRole("button", { name: /Order list/ })).toBeEnabled();
  const automaticResponse = page.waitForResponse((r) => r.url().endsWith("/api/evaluate"));
  await page.getByRole("checkbox", { name: "Automatic verification" }).check();
  expect((await automaticResponse).ok()).toBe(true);
  await expect(page.getByRole("status")).toContainText("Design needs correction", {
    timeout: 120000,
  });
  await page.getByRole("button", { name: "Supplier files", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("");
  await expect(page.getByRole("alert")).toContainText("Enter a valid number");
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1674");
  await expect(page.getByRole("button", { name: /Order list/ })).toBeEnabled({
    timeout: 120000,
  });
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: /Order list/ }).click();
  const download = await downloading;
  expect(await download.failure()).toBeNull();
  await download.saveAs("../artifacts/browser-order-list.csv");
  const changed = page.waitForResponse((r) => r.url().endsWith("/api/evaluate"));
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1700");
  expect((await changed).ok()).toBe(true);
  await expect(page.getByRole("status")).toContainText("Design needs correction", {
    timeout: 120000,
  });
  const rejected = page.waitForResponse((r) => r.url().endsWith("/api/evaluate"));
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("100");
  expect((await rejected).status()).toBe(422);
  await expect(page.getByRole("alert")).toContainText("width_mm");
  await expect(page.getByRole("button", { name: /Complete supplier pack/ })).toBeDisabled();
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1674");
  await expect(page.getByRole("status")).toContainText("Design needs correction", {
    timeout: 120000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../artifacts/enclosure-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
