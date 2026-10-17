import { expect, test, type Locator } from "@playwright/test"

const BUTTONS = [
  { name: "Get in touch", href: /^mailto:/ },
] as const

async function motion(part: Locator) {
  return part.evaluate((el) => {
    const style = getComputedStyle(el)
    return `${style.transform}|${style.animationName}`
  })
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 360, height: 640 },
]) {
  test(`trail buttons link, read, and turn into a compass at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    for (const { name, href } of BUTTONS) {
      const button = page.getByRole("link", { name, exact: true })
      await expect(button).toHaveAttribute("href", href)
      await button.scrollIntoViewIfNeeded()

      const box = (await button.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

      if (viewport.width < 768) continue
      const part = button.locator(".trail-btn-needle")
      await page.mouse.move(0, 0)
      const before = await motion(part)
      await button.hover()
      await expect.poll(() => motion(part)).not.toBe(before)
    }
  })
}
