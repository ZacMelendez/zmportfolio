import { expect, test, type Page } from "@playwright/test"

const WIDE = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }

/** Scrolls so the reading line (60% down the viewport) sits at `y` within the section. */
async function readTo(page: Page, y: number) {
  await page.evaluate((target) => {
    const section = document.getElementById("about")!
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top + target - window.innerHeight * 0.6)
  }, y)
}

async function open(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
  await expect(
    page.getByTestId("about-contours").locator("path").first(),
  ).toBeAttached()
}

test("wide: photo beside the copy, under Chocorua's summit", async ({
  page,
}) => {
  await open(page, WIDE)
  const photo = (await page.locator("#about figure").boundingBox())!
  const heading = (await page.locator("#about h2").boundingBox())!
  expect(photo.x).toBeGreaterThan(heading.x + heading.width)

  // Chocorua's summit, as placed by the map's layout.
  const map = (await page
    .getByTestId("about-contours")
    .locator("svg")
    .first()
    .boundingBox())!
  const summit = {
    x: map.x + map.width * 0.7131,
    y: map.y + map.height * 0.6589,
  }
  expect(summit.y).toBeLessThan(photo.y)
  expect(summit.x).toBeGreaterThan(photo.x)
  expect(summit.x).toBeLessThan(photo.x + photo.width)

  const pin = (await page.getByTestId("about-notes-pin").boundingBox())!
  expect(pin.y + pin.height).toBeLessThan(photo.y)
})

test("wide: Champney Falls Trail runs down the left margin", async ({
  page,
}) => {
  await open(page, WIDE)
  const section = (await page.locator("#about").boundingBox())!
  const content = (await page
    .locator("#about [data-map-content]")
    .boundingBox())!
  const trail = (await page.getByTestId("about-trail-solid").boundingBox())!

  expect(trail.x).toBeGreaterThan(section.x + 8)
  expect(trail.x + trail.width).toBeLessThan(content.x - 8)
  // The trailhead sits a little way down its frame.
  expect(trail.y).toBeLessThan(section.y + section.height * 0.05)
  expect(trail.y + trail.height).toBeGreaterThan(section.y + section.height - 4)

  const label = page.getByTestId("about-trail-label")
  await expect(label).toHaveText("CHAMPNEY FALLS TRAIL")
  expect((await label.boundingBox())!.x + 1).toBeLessThan(content.x)
})

/** Where the Champney Falls Trail label's centre sits, as a share of its guide path's length. */
function labelShare(page: Page) {
  return page
    .getByTestId("about-trail-label")
    .locator("textPath")
    .evaluate((el) => {
      const guide = document.getElementById(
        el.getAttribute("href")!.slice(1),
      ) as SVGPathElement | null
      return Number(el.getAttribute("startOffset")) / guide!.getTotalLength()
    })
}

test("wide: Champney Falls Trail name slides down its guide as the trail draws", async ({
  page,
}) => {
  await open(page, WIDE)
  const height = await page.locator("#about").evaluate((el) => el.offsetHeight)
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

test("narrow: Champney Falls Trail crosses the gap between the photo and the copy", async ({
  page,
}) => {
  await open(page, NARROW)
  const box = (await page.locator("#about").boundingBox())!
  expect(box.width).toBeLessThanOrEqual(NARROW.width)

  const photo = (await page.locator("#about figure").boundingBox())!
  const copy = (await page.locator("#about [data-map-copy]").boundingBox())!
  const trail = (await page.getByTestId("about-trail-solid").boundingBox())!
  expect(trail.width).toBeGreaterThan(NARROW.width * 0.9)
  expect(trail.y).toBeGreaterThan(photo.y + photo.height)
  expect(trail.y + trail.height).toBeLessThan(copy.y)

  const label = page.getByTestId("about-trail-label")
  await expect(label).toHaveText("CHAMPNEY FALLS TRAIL")
  const name = (await label.boundingBox())!
  expect(name.y).toBeGreaterThan(photo.y + photo.height)
  expect(name.y + name.height).toBeLessThan(copy.y)
  expect(name.x).toBeGreaterThanOrEqual(0)
  expect(name.x + name.width).toBeLessThanOrEqual(NARROW.width)
})

test("experience timeline is back to its plain divider and dots", async ({
  page,
}) => {
  await page.setViewportSize(WIDE)
  await page.goto("/")
  await expect(page.locator("#experience svg[data-testid]")).toHaveCount(0)
  const dots = page.locator("#experience ol li > span.rounded-full")
  await expect(dots).toHaveCount(3)
  for (const dot of await dots.all()) await expect(dot).toBeVisible()
})
