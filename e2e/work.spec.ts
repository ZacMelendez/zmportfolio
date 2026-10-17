import { expect, test, type Page } from "@playwright/test"

const WIDE = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

async function open(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
  await expect(
    page.getByTestId("work-contours").locator("path").first(),
  ).toBeAttached()
}

/** Scrolls so the reading line (60% down the viewport) sits at `y` within the section. */
async function readTo(page: Page, y: number) {
  await page.evaluate((target) => {
    const section = document.getElementById("work")!
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top + target - window.innerHeight * 0.6)
  }, y)
}

/** The trace head's y within the section, from the solid line's dash length. */
async function headY(page: Page) {
  return page.getByTestId("work-road-solid").evaluate((el) => {
    const path = el as SVGPathElement
    const drawn = Number.parseFloat(
      path.dataset.drawn ?? "0",
    )
    return path.getPointAtLength(drawn).y
  })
}

test("wide: Skyline Drive runs down the right margin beside the projects", async ({
  page,
}) => {
  await open(page, WIDE)
  const section = (await page.locator("#work").boundingBox())!
  const content = (await page
    .locator("#work [data-map-content]")
    .boundingBox())!
  const heading = (await page.locator("#work h2").boundingBox())!
  const road = (await page.getByTestId("work-road-solid").boundingBox())!

  expect(road.x).toBeGreaterThan(content.x + content.width + 8)
  expect(road.x + road.width).toBeLessThan(section.x + section.width - 8)
  expect(road.y).toBeLessThan(section.y + 4)
  expect(road.y + road.height).toBeGreaterThan(section.y + section.height - 4)

  // Notes pin above the heading; road name beside the road, outside the content.
  const pin = (await page.getByTestId("work-notes-pin").boundingBox())!
  expect(pin.y + pin.height).toBeLessThan(heading.y)
  const label = page.getByTestId("work-road-label")
  await expect(label).toHaveText("SKYLINE DRIVE")
  expect((await label.boundingBox())!.x).toBeGreaterThan(
    content.x + content.width,
  )
})

test("wide: trace keeps pace with reading", async ({ page }) => {
  await open(page, WIDE)
  const height = await page.locator("#work").evaluate((el) => el.offsetHeight)

  await readTo(page, -50)
  await expect(page.getByTestId("work-road-dot")).toBeHidden()

  await readTo(page, height * 0.5)
  await expect.poll(() => headY(page)).toBeGreaterThan(height * 0.5 - 30)
  expect(await headY(page)).toBeLessThan(height * 0.5 + 30)
  await expect(page.getByTestId("work-road-dot")).toBeVisible()

  await readTo(page, height + 200)
  await expect(page.getByTestId("work-road-dot")).toBeHidden()
})

test("narrow: contours behind the heading, Skyline Drive across the gap below the featured projects", async ({
  page,
}) => {
  await open(page, NARROW)

  const heading = (await page.locator("#work h2").boundingBox())!
  const contours = (await page.getByTestId("work-contours").boundingBox())!
  expect(contours.x).toBeLessThanOrEqual(heading.x)
  expect(contours.y).toBeLessThanOrEqual(heading.y)

  const featured = (await page
    .locator("#work [data-map-featured]")
    .boundingBox())!
  const more = (await page.locator("#work-more").boundingBox())!
  const road = (await page.getByTestId("work-road-solid").boundingBox())!
  expect(road.width).toBeGreaterThan(NARROW.width * 0.9)
  expect(road.y).toBeGreaterThan(featured.y + featured.height)
  expect(road.y + road.height).toBeLessThan(more.y)

  const label = page.getByTestId("work-road-label")
  await expect(label).toHaveText("SKYLINE DRIVE")
  const name = (await label.boundingBox())!
  expect(name.y).toBeGreaterThan(featured.y + featured.height)
  expect(name.y + name.height).toBeLessThan(more.y)
  expect(name.x).toBeGreaterThanOrEqual(0)
  expect(name.x + name.width).toBeLessThanOrEqual(NARROW.width)
})

test("narrow: the road draws across as its gap scrolls up the screen", async ({
  page,
}) => {
  await open(page, NARROW)
  const drawn = () => page.getByTestId("work-road-solid").evaluate((el) => {
      const path = el as SVGPathElement
      const dash = Number.parseFloat(path.dataset.drawn!)
      return dash / path.getTotalLength()
    })
  const scrollGapTo = (share: number) =>
    page.evaluate((share) => {
      const more = document.getElementById("work-more")!
      const top = more.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, top - 56 - window.innerHeight * share)
    }, share)

  await scrollGapTo(1.1)
  await page.waitForTimeout(600)
  expect(await drawn()).toBe(0)

  await scrollGapTo(0.65)
  await expect.poll(drawn).toBeGreaterThan(0.3)
  expect(await drawn()).toBeLessThan(0.8)

  await scrollGapTo(0.2)
  await expect.poll(drawn).toBe(1)
})

/** Where the Skyline Drive label's centre sits, as a share of its guide path's length. */
function labelShare(page: Page) {
  return page
    .getByTestId("work-road-label")
    .locator("textPath")
    .evaluate((el) => {
      const guide = document.getElementById(
        el.getAttribute("href")!.slice(1),
      ) as SVGPathElement | null
      return Number(el.getAttribute("startOffset")) / guide!.getTotalLength()
    })
}

test("wide: Skyline Drive name slides down its guide as the road draws", async ({
  page,
}) => {
  await open(page, WIDE)
  const height = await page.locator("#work").evaluate((el) => el.offsetHeight)
  const shares: number[] = []
  for (const y of [-50, height * 0.5, height + 200]) {
    await readTo(page, y)
    await page.waitForTimeout(900)
    shares.push(await labelShare(page))
  }
  expect(shares[0]).toBeGreaterThan(0.1)
  expect(shares[1]).toBeGreaterThan(shares[0] + 0.15)
  expect(shares[2]).toBeGreaterThan(shares[1] + 0.15)
  expect(shares[2]).toBeLessThan(0.9)
})
