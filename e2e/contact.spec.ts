import { expect, test, type Page } from "@playwright/test"

/** Each ridge's offset from its resting place in frame units, nearest last. */
function ridgeOffsets(page: Page) {
  return page.getByTestId("contact-ridges").evaluate((svg) =>
    [...svg.querySelectorAll("path")].map((p) => {
      const m = new DOMMatrix(getComputedStyle(p).transform)
      return { x: m.e, y: m.f }
    }),
  )
}

async function ridgeDrops(page: Page) {
  return (await ridgeOffsets(page)).map((o) => o.y)
}

test("Blue Ridge rises and slides into place, nearest ridges fastest", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  const scrollToEnd = (back: number) =>
    page.evaluate((b) => {
      const end = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, end - b)
    }, back)

  await scrollToEnd(300)
  await expect
    .poll(async () => (await ridgeDrops(page)).at(-1))
    .toBeGreaterThan(5)
  const partway = await ridgeOffsets(page)
  for (let i = 1; i < partway.length; i++) {
    expect(partway[i].y).toBeGreaterThan(partway[i - 1].y)
    // Neighbours come in from opposite sides, nearer ones from further out.
    expect(Math.sign(partway[i].x)).toBe(-Math.sign(partway[i - 1].x))
    expect(Math.abs(partway[i].x)).toBeGreaterThan(Math.abs(partway[i - 1].x))
  }

  await scrollToEnd(0)
  await expect
    .poll(async () =>
      Math.max(
        ...(await ridgeOffsets(page)).flatMap((o) => [Math.abs(o.x), o.y]),
      ),
    )
    .toBeLessThan(0.5)
})

test("ridges stay put with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await page.evaluate(() => window.scrollTo(0, 0))
  const offsets = await ridgeOffsets(page)
  expect(Math.max(...offsets.flatMap((o) => [Math.abs(o.x), o.y]))).toBe(0)
})

test("peaks are tagged, one tag on phones", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  )
  // The tag itself is a zero-size anchor on the summit; its label shows.
  const labels = page.getByTestId("peak-tag").locator(".peak-tag-label")
  await expect(labels).toHaveCount(3)
  await expect(labels.filter({ hasText: "Hawksbill" })).toContainText(
    "4,051 ft",
  )
  for (const label of await labels.all()) await expect(label).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(labels.filter({ visible: true })).toHaveCount(1)
  await expect(labels.filter({ visible: true })).toContainText("Hawksbill")
})
