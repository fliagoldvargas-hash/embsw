import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const target = "https://www.wagmiswap.trade/";
const root = process.cwd();
const researchDir = path.join(root, "docs", "research");
const refsDir = path.join(root, "docs", "design-references");

await fs.mkdir(researchDir, { recursive: true });
await fs.mkdir(refsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});

const page = await context.newPage();
await page.goto(target, { waitUntil: "networkidle", timeout: 90000 });
await page.screenshot({ path: path.join(refsDir, "wagmiswap-desktop-full.png"), fullPage: true });

const pageData = await page.evaluate(() => {
  const sameOrigin = (href) => {
    try {
      const u = new URL(href, location.href);
      return u.origin === location.origin;
    } catch {
      return false;
    }
  };

  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y + scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };

  const cssProps = [
    "fontSize",
    "fontWeight",
    "fontFamily",
    "lineHeight",
    "letterSpacing",
    "color",
    "backgroundColor",
    "backgroundImage",
    "padding",
    "margin",
    "display",
    "position",
    "top",
    "zIndex",
    "borderRadius",
    "border",
    "boxShadow",
    "transform",
    "transition",
    "opacity",
  ];

  const pickStyles = (el) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(cssProps.map((p) => [p, cs[p]]).filter(([, v]) => v && v !== "none" && v !== "normal"));
  };

  const elements = [...document.querySelectorAll("header, nav, main > *, section, footer")]
    .map((el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      id: el.id,
      classes: String(el.className || ""),
      role: el.getAttribute("role"),
      ariaLabel: el.getAttribute("aria-label"),
      text: el.innerText?.replace(/\s+/g, " ").trim().slice(0, 1400) || "",
      rect: rect(el),
      styles: pickStyles(el),
    }))
    .filter((el) => el.rect.height > 20 || el.text);

  const buttons = [...document.querySelectorAll("button, [role='button'], a")]
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.replace(/\s+/g, " ").trim(),
      href: el.href || null,
      target: el.target || null,
      ariaLabel: el.getAttribute("aria-label"),
      classes: String(el.className || ""),
      rect: rect(el),
      styles: pickStyles(el),
    }))
    .filter((x) => x.text || x.ariaLabel || x.href);

  const images = [...document.images].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    rect: rect(img),
    classes: String(img.className || ""),
    parentClasses: String(img.parentElement?.className || ""),
  }));

  const backgroundImages = [...document.querySelectorAll("*")]
    .map((el) => ({ url: getComputedStyle(el).backgroundImage, selector: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className || "").split(" ").filter(Boolean).slice(0, 3).join(".")}` }))
    .filter((x) => x.url && x.url !== "none");

  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => ({ text: a.textContent?.replace(/\s+/g, " ").trim(), href: a.href, internal: sameOrigin(a.href), target: a.target || null }))
    .filter((x) => x.href);

  const colors = [...new Set([...document.querySelectorAll("*")].flatMap((el) => {
    const cs = getComputedStyle(el);
    return [cs.color, cs.backgroundColor, cs.borderColor].filter(Boolean);
  }))].slice(0, 80);

  const fonts = [...new Set([...document.querySelectorAll("*")].map((el) => getComputedStyle(el).fontFamily))];
  const favicons = [...document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='manifest']")].map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes?.toString() }));
  const svgs = [...document.querySelectorAll("svg")].map((svg) => svg.outerHTML.slice(0, 5000));

  return {
    url: location.href,
    title: document.title,
    description: document.querySelector("meta[name='description']")?.content || "",
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
    bodyText: document.body.innerText.replace(/\s+/g, " ").trim(),
    links,
    buttons,
    images,
    backgroundImages,
    colors,
    fonts,
    favicons,
    svgs,
    elements,
    scripts: [...document.scripts].map((s) => s.src).filter(Boolean),
    stylesheets: [...document.querySelectorAll("link[rel='stylesheet']")].map((l) => l.href),
  };
});

await fs.writeFile(path.join(researchDir, "site-data.json"), JSON.stringify(pageData, null, 2));

const internalRoutes = [...new Set(pageData.links.filter((l) => l.internal).map((l) => new URL(l.href).pathname))]
  .filter((pathname) => !pathname.includes("."))
  .sort();
await fs.writeFile(path.join(researchDir, "routes.json"), JSON.stringify(internalRoutes, null, 2));

for (const route of internalRoutes) {
  const routePage = await context.newPage();
  const url = new URL(route, target).href;
  try {
    await routePage.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const name = route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await routePage.screenshot({ path: path.join(refsDir, `wagmiswap-${name}-desktop.png`), fullPage: true });
    await fs.writeFile(
      path.join(researchDir, `page-${name}.json`),
      JSON.stringify({
        route,
        url: routePage.url(),
        title: await routePage.title(),
        text: (await routePage.locator("body").innerText()).replace(/\s+/g, " ").trim(),
        links: await routePage.$$eval("a[href]", (as) => as.map((a) => ({ text: a.textContent?.replace(/\s+/g, " ").trim(), href: a.href, target: a.target || null }))),
      }, null, 2)
    );
  } catch (error) {
    await fs.writeFile(path.join(researchDir, `page-error-${route.replace(/[^a-z0-9]+/gi, "-") || "home"}.txt`), String(error));
  } finally {
    await routePage.close();
  }
}

const mobile = await browser.newContext({
  viewport: { width: 390, height: 900 },
  isMobile: true,
  deviceScaleFactor: 2,
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(target, { waitUntil: "networkidle", timeout: 90000 });
await mobilePage.screenshot({ path: path.join(refsDir, "wagmiswap-mobile-full.png"), fullPage: true });

await mobile.close();
await context.close();
await browser.close();

console.log(JSON.stringify({ title: pageData.title, routes: internalRoutes, images: pageData.images.length, backgrounds: pageData.backgroundImages.length, svgs: pageData.svgs.length }, null, 2));
