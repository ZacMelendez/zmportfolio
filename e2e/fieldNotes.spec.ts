import { expect, test, type Page } from "@playwright/test"

const WIDE = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

const MAPS = [
  { id: "kuwohi", pin: "hero-notes-pin", name: "Kuwohi" },
  { id: "hawksbill", pin: "work-notes-pin", name: "Blue Ridge" },
  { id: "chocorua", pin: "about-notes-pin", name: "Chocorua" },
] as const

async function open(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
}

for (const map of MAPS) {
  test(`wide: ${map.name}'s pin opens its field notes`, async ({ page }) => {
    await open(page, WIDE)

    const pin = page.getByTestId(map.pin)
    await expect(pin).toContainText(map.name)
    await pin.click()
    const drawer = page.getByTestId(`field-notes-${map.id}`)
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole("heading", { level: 2 })).toHaveText(map.name)

    await page.keyboard.press("Escape")
    await expect(drawer).toBeHidden()
    await expect(pin).toBeFocused()
  })

  test(`narrow: ${map.name}'s pin opens its field notes`, async ({ page }) => {
    await open(page, NARROW)

    await page.getByTestId(map.pin).click()
    const drawer = page.getByTestId(`field-notes-${map.id}`)
    await expect(drawer).toBeVisible()

    await drawer.getByRole("button", { name: "Close field notes" }).click()
    await expect(drawer).toBeHidden()
  })
}

test("a click on the backdrop closes the field notes", async ({ page }) => {
  await open(page, WIDE)
  await page.getByTestId("work-notes-pin").click()
  const drawer = page.getByTestId("field-notes-hawksbill")
  await expect(drawer).toBeVisible()

  await page.mouse.click(40, WIDE.height / 2)
  await expect(drawer).toBeHidden()
})

test("the photo carousel steps through photos and keeps its counter in step", async ({
  page,
}) => {
  await open(page, WIDE)
  await page.getByTestId("work-notes-pin").click()
  const drawer = page.getByTestId("field-notes-hawksbill")
  const counter = drawer.locator("[aria-live]")
  const previous = drawer.getByRole("button", { name: "Previous photo" })
  const next = drawer.getByRole("button", { name: "Next photo" })

  await expect(counter).toHaveText("1 / 6")
  await expect(previous).toBeDisabled()
  await expect(drawer.locator("figcaption").first()).toContainText("Nov 2025")

  await next.click()
  await expect(counter).toHaveText("2 / 6")
  await drawer.getByRole("button", { name: "Photo 6", exact: true }).click()
  await expect(counter).toHaveText("6 / 6")
  await expect(next).toBeDisabled()

  await previous.click()
  await expect(counter).toHaveText("5 / 6")
})

test("a single trip shows no trip tabs", async ({ page }) => {
  await open(page, WIDE)
  await page.getByTestId("about-notes-pin").click()
  const drawer = page.getByTestId("field-notes-chocorua")
  await expect(drawer.locator("figure")).toHaveCount(4)
  await expect(drawer.getByRole("tablist")).toHaveCount(0)
  await expect(drawer.locator("dt", { hasText: "Hiked" }).locator("+ dd")).toHaveText("Aug 2022")
})

test("trips switch the stats, story and photos, and reopen on the latest", async ({
  page,
}) => {
  await open(page, WIDE)
  const pin = page.getByTestId("work-notes-pin")
  await pin.click()
  const drawer = page.getByTestId("field-notes-hawksbill")
  const latest = drawer.getByRole("tab", { name: /Hawksbill.*Nov 2025/ })
  const earlier = drawer.getByRole("tab", { name: /The Priest.*Nov 2021/ })
  const hiked = drawer.locator("dt", { hasText: "Hiked" }).locator("+ dd")
  const counter = drawer.locator("[aria-live]")

  await expect(drawer.getByRole("tab")).toHaveCount(2)
  await expect(latest).toHaveAttribute("aria-selected", "true")
  await expect(hiked).toHaveText("Nov 2025")
  await expect(drawer).toContainText("38.555, -78.395")
  await drawer.getByRole("button", { name: "Next photo" }).click()
  await expect(counter).toHaveText("2 / 6")

  await earlier.click()
  await expect(earlier).toHaveAttribute("aria-selected", "true")
  await expect(hiked).toHaveText("Nov 2021")
  await expect(drawer.getByRole("tabpanel")).toContainText("An overnight on The Priest")
  // A new trip's carousel starts over.
  await expect(counter).toHaveText("1 / 3")
  // The trip's own place replaces the range's coordinates.
  await expect(drawer).not.toContainText("38.555, -78.395")

  // Arrow keys move between trips.
  await page.keyboard.press("ArrowLeft")
  await expect(latest).toBeFocused()
  await expect(hiked).toHaveText("Nov 2025")
  await page.keyboard.press("End")
  await expect(earlier).toBeFocused()
  await expect(hiked).toHaveText("Nov 2021")

  await page.keyboard.press("Escape")
  await pin.click()
  await expect(latest).toHaveAttribute("aria-selected", "true")
})

test("a photo opens full screen and zooms, pans and resets", async ({ page }) => {
  await open(page, WIDE)
  await page.getByTestId("work-notes-pin").click()
  const drawer = page.getByTestId("field-notes-hawksbill")
  await drawer.getByRole("button", { name: "View photo 1 full screen" }).click()

  const lightbox = page.getByTestId("field-notes-lightbox")
  const photo = lightbox.locator("img")
  const zoomIn = lightbox.getByRole("button", { name: "Zoom in" })
  const level = lightbox.getByRole("group", { name: "Zoom" })
  const transform = () => photo.evaluate((img) => img.style.transform)
  await expect(lightbox).toBeVisible()
  await expect(level).toContainText("100%")
  await expect(lightbox.getByRole("button", { name: "Zoom out" })).toBeDisabled()

  await zoomIn.click()
  await expect(level).toContainText("150%")
  // Zoomed, the side arrows give way to panning.
  await expect(lightbox.getByRole("button", { name: "Next photo" })).toBeHidden()

  // A drag pans the photo, and doesn't close the lightbox.
  const before = await transform()
  const box = (await photo.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 150, cy - 60, { steps: 5 })
  await page.mouse.up()
  expect(await transform()).not.toBe(before)
  await expect(lightbox).toBeVisible()

  await lightbox.getByRole("button", { name: "Fit photo to screen" }).click()
  await expect(level).toContainText("100%")

  // The wheel zooms in, and a double-click back out.
  await page.mouse.move(cx, cy)
  await page.mouse.wheel(0, -400)
  await expect(level).not.toContainText("100%")
  await photo.dblclick()
  await expect(level).toContainText("100%")
  // And at fit size, a double-click zooms in.
  await photo.dblclick()
  await expect(level).toContainText("250%")

  // Keys: 0 resets, + zooms, and a new photo starts at fit size.
  await page.keyboard.press("0")
  await expect(level).toContainText("100%")
  await page.keyboard.press("+")
  await expect(level).toContainText("150%")
  await page.keyboard.press("0")
  await page.keyboard.press("ArrowRight")
  await expect(lightbox).toContainText("2 / 6")
  await expect(level).toContainText("100%")

  await page.keyboard.press("Escape")
  await expect(lightbox).toBeHidden()
})
