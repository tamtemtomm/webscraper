import puppeteer from "puppeteer";
import { sleep } from "./utils.js";

export const initializePage = async (headless = true) => {
  const browser = await puppeteer.launch({
    headless: headless ? "new" : false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    window.chrome = { runtime: {} };
  });

  return page;
};

export const findElement = async (page, xpath, timeout = 10000) => {
  await page.waitForSelector(`::-p-xpath(${xpath})`, {
    timeout: timeout,
  });
  const element = await page.$(`::-p-xpath(${xpath})`);
  return element;
};

export const findElements = async (page, xpath, timeout = 1000) => {
  await page.waitForSelector(`::-p-xpath(${xpath})`, {
    timeout: timeout,
  });
  const elements = await page.$$(`::-p-xpath(${xpath})`);
  return elements;
};

export const scroll = async (
  page,
  scrollBy = 1000,
  times = 7,
  timeout = 200
) => {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, scrollBy);
    });
    await sleep(timeout);
  }
};
