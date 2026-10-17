import { expect, test, type Page } from "@playwright/test"

const LANDSCAPE_VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
  { width: 844, height: 390 },
]

const PORTRAIT_VIEWPORTS = [
  { width: 1024, height: 1366 },
  { width: 768, height: 1024 },
  { width: 700, height: 700 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
]

/** Where the turned map puts the ridge on portrait screens taller than it. */
const PORTRAIT_RIDGE_AT = 0.6

async function boxOf(page: Page, testId: string) {
  const locator = page.getByTestId(testId)
  await expect(locator).toBeAttached()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

async function contoursBox(page: Page) {
  await expect(
    page.getByTestId("hero-contours").locator("path").first(),
  ).toBeAttached()
  return boxOf(page, "hero-contours")
}

for (const viewport of [...LANDSCAPE_VIEWPORTS, ...PORTRAIT_VIEWPORTS]) {
  test(`hero map covers the viewport at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    const map = await boxOf(page, "hero-map")
    expect(map.x).toBeCloseTo(0, 0)
    expect(map.y).toBeCloseTo(0, 0)
    expect(map.width).toBeCloseTo(viewport.width, 0)
    expect(map.height).toBeCloseTo(viewport.height, 0)
  })
}

for (const viewport of LANDSCAPE_VIEWPORTS) {
  test(`ridge runs down the middle at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    const ridge = await boxOf(page, "hero-ridge-solid")
    expect(ridge.height).toBeGreaterThan(ridge.width)
    expect(
      Math.abs(ridge.x + ridge.width / 2 - viewport.width / 2),
    ).toBeLessThan(2)

    const contours = await contoursBox(page)
    expect(contours.x).toBeLessThan(0.5)
    expect(contours.y + contours.height).toBeGreaterThan(viewport.height - 0.5)
  })
}

for (const viewport of PORTRAIT_VIEWPORTS) {
  test(`ridge runs across the lower half at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    // Lower still on screens squarer than the map, never off the bottom.
    const ridge = await boxOf(page, "hero-ridge-solid")
    expect(ridge.width).toBeGreaterThan(ridge.height)
    const middle = ridge.y + ridge.height / 2
    expect(middle).toBeGreaterThan(viewport.height * PORTRAIT_RIDGE_AT - 2)
    expect(middle).toBeLessThan(viewport.height)

    const contours = await contoursBox(page)
    expect(contours.x).toBeLessThan(0.5)
    expect(contours.x + contours.width).toBeGreaterThan(viewport.width - 0.5)
    expect(contours.y + contours.height).toBeGreaterThan(viewport.height - 0.5)
  })
}

/** Where the solid trace currently ends, in viewport pixels, plus how much is drawn. */
async function traceHead(page: Page) {
  return page.getByTestId("hero-ridge-solid").evaluate((el) => {
    const path = el as SVGPathElement
    const length = path.getTotalLength()
    const drawn = Number.parseFloat(
      path.dataset.drawn ?? "0",
    )
    const ctm = path.getScreenCTM()!
    const { x, y } = path.getPointAtLength(drawn).matrixTransform(ctm)
    return { x, y, drawnShare: drawn / length }
  })
}

async function heroHeight(page: Page) {
  return page
    .locator("main > section")
    .first()
    .evaluate((el) => el.offsetHeight)
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  const landscape = viewport.width > viewport.height

  test(`trace starts 5% along the trail at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    await expect(page.getByTestId("hero-ridge-dot")).toBeVisible()
    const head = await traceHead(page)
    expect(head.drawnShare).toBeGreaterThanOrEqual(0.05 - 0.001)
    expect(head.drawnShare).toBeLessThan(0.25)
    // Starts inside the screen, clear of the edge the trail enters from.
    expect(landscape ? head.y : head.x).toBeGreaterThan(20)

    await page.mouse.wheel(0, 60)
    await expect
      .poll(async () => (await traceHead(page)).drawnShare)
      .toBeGreaterThan(head.drawnShare + 0.01)
  })

  test(`dotted line clears behind the dot at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.mouse.wheel(0, 120)

    await expect
      .poll(() =>
        page.evaluate(() => {
          const solid = document.querySelector(
            '[data-testid="hero-ridge-solid"]',
          )
          const dotted = document.querySelector(
            '[data-testid="hero-ridge-dotted"]',
          )
          const maskId = dotted
            ?.getAttribute("mask")
            ?.match(/url\(#(.+)\)/)?.[1]
          const travelled = maskId
            ? document.getElementById(maskId)?.querySelector("path")
            : null
          return (
            !!travelled &&
            !!travelled.getAttribute("d") &&
            travelled.getAttribute("d") === solid?.getAttribute("d")
          )
        }),
      )
      .toBe(true)
  })

  test(`trace finishes while the hero is on screen at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    const scroll = Math.ceil((await heroHeight(page)) * 0.35)
    await page.evaluate((y) => window.scrollTo(0, y), scroll)
    await expect
      .poll(async () => (await traceHead(page)).drawnShare)
      .toBeCloseTo(1, 3)
    await expect(page.getByTestId("hero-ridge-dot")).toBeHidden()

    const ridge = await boxOf(page, "hero-ridge-solid")
    expect(ridge.y + ridge.height).toBeGreaterThan(0)
  })
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const landscape = viewport.width > viewport.height

  test(`road label rides from a third to three-quarters down its guide at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    const label = page.getByTestId("hero-road-label")
    await expect(label).toHaveText("NEWFOUND GAP ROAD")
    await page.evaluate(() => document.fonts.ready)

    // Where the label's centre sits, as a share of its guide path's length.
    const share = () => label.locator("textPath").evaluate((el) => {
      const guide = document.getElementById(
        el.getAttribute("href")!.slice(1),
      ) as SVGPathElement | null
      return Number(el.getAttribute("startOffset")) / guide!.getTotalLength()
    })

    await expect.poll(share).toBeCloseTo(0.33, 2)

    const shares: number[] = []
    for (const scroll of [0.08, 0.16, 0.4]) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        Math.round(viewport.height * scroll),
      )
      await page.waitForTimeout(900)
      shares.push(await share())
      const box = (await label.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    }
    expect(shares[0]).toBeGreaterThan(0.33)
    expect(shares[1]).toBeGreaterThan(shares[0])
    // Done drawing: three-quarters down, or the visible end of the road on mobile.
    if (landscape) expect(shares[2]).toBeCloseTo(0.75, 2)
    else expect(shares[2]).toBeLessThanOrEqual(0.75 + 0.001)
  })
}

for (const viewport of [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
]) {
  test(`hero copy sits right of the ridge at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.evaluate(() => document.fonts.ready)

    // The ridge group includes the road label, so this clears both.
    const ridge = await boxOf(page, "hero-ridge")
    const heading = await page.getByRole("heading", { level: 1 }).boundingBox()
    expect(heading!.x).toBeGreaterThan(ridge.x + ridge.width + 16)

    const tagline = page
      .getByText("Building for game day. Hiking on the off days.")
      .locator("visible=true")
    await expect(tagline).toBeVisible()
    const tag = await tagline.boundingBox()
    expect(tag!.x + tag!.width).toBeLessThanOrEqual(viewport.width - 24)
  })
}

for (const viewport of PORTRAIT_VIEWPORTS) {
  test(`hero copy sits above the ridge at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.evaluate(() => document.fonts.ready)

    // The ridge group's own box includes the label's unseen guide, so take
    // the visible parts: the road label and the trace above the ridge.
    const tops = await Promise.all(
      ["hero-road-label", "hero-ridge-dotted", "hero-ridge-solid"].map(
        async (id) => (await boxOf(page, id)).y,
      ),
    )
    // The tagline is the last of the copy on portrait screens.
    const tagline = await page
      .getByText("Building for game day. Hiking on the off days.")
      .locator("visible=true")
      .boundingBox()
    const copyEnd = tagline!.y + tagline!.height
    expect(copyEnd).toBeLessThan(Math.min(...tops) - 8)

    const pin = await boxOf(page, "hero-notes-pin")
    expect(pin.y).toBeGreaterThan(copyEnd)
  })
}
