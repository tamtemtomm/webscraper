// simple-scraper.js
import puppeteer from "puppeteer";
import { TOKOPEDIA } from "./config.js";
import fs from "fs";
const readline = await import("readline");

const PROMPT = "sepatu";
let stop = false;

const initializePage = async (headless = false) => {
  const browser = await puppeteer.launch({
    headless: headless,
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

const intializeWriter = (filePath) => {
  // Initialize the CSV file with headers
  const csvHeader = "Name;Price;Link;Image\n";
  fs.writeFileSync(filePath, csvHeader);
};

const findElement = async (page, xpath, timeout = 10000) => {
  await page.waitForSelector(`::-p-xpath(${xpath})`, {
    timeout: timeout,
  });
  const element = await page.$(`::-p-xpath(${xpath})`);
  return element;
};

const findElements = async (page, xpath, timeout = 10000) => {
  await page.waitForSelector(`::-p-xpath(${xpath})`, {
    timeout: timeout,
  });
  const elements = await page.$$(`::-p-xpath(${xpath})`);
  return elements;
};

const sleep = async (timeout) => {
  await new Promise((r) => setTimeout(r, 2000));
};

const setupKeyListener = () => {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (_, key) => {
    if (key.name === "q") {
      console.log("Received 'q'. Stopping the scraper...");
      stop = true;
    }
  });
};

(async () => {
  setupKeyListener();
  const page = await initializePage();
  intializeWriter("results.csv");

  // Go to Tokopedia
  await page.goto(TOKOPEDIA.HOMEPAGE_LINK);

  // Wait for the search bar using XPath
  const searchBar = await findElement(page, TOKOPEDIA.SEARCH_BAR_XPATH);
  if (searchBar) {
    await searchBar.type(PROMPT);
    await searchBar.press("Enter");
  } else {
    console.error("Search bar not found.");
  }

  while (!stop) {
    await sleep(1000);

    // Now perform auto-scroll to load more content
    for (let i = 0; i < 7; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 1000);
      });
      await sleep(200);
    }

    const productLinks = await findElements(page, TOKOPEDIA.PRODUCT_XPATH);
    const productNames = await findElements(
      page,
      TOKOPEDIA.PRODUCT_NAMES_XPATH
    );
    const productPrices = await findElements(
      page,
      TOKOPEDIA.PRODUCT_PRICES_XPATH
    );
    const productImages = await findElements(
      page,
      TOKOPEDIA.PRODUCT_IMAGES_XPATH
    );

    await Promise.all(
      productLinks.map(async (link, index) => {
        await sleep;
        const href = link
          ? await link
              .getProperty("href")
              .then((href) => href.jsonValue())
              .then((href) => href.replace(/;/g, ":"))
          : null;
        const name = productNames[index]
          ? await productNames[index]
              .evaluate((el) => el.innerText)
              .then((name) => name.replace(/;/g, ":"))
          : null;
        const price = productPrices[index]
          ? await productPrices[index]
              .evaluate((el) => el.innerText)
              .then((price) => price.replace(/;/g, ":"))
          : null;
        const priceFloat = parseFloat(price.replace(/[^\d]/g, ""));
        const imageSrc = productImages[index]
          ? await productImages[index]
              .getProperty("src")
              .then((src) => src.jsonValue())
              .then((src) => src.replace(/;/g, ":"))
          : null;

        // Prepare the product data as CSV row
        const csvRow = `${name};${priceFloat};${href};${imageSrc}\n`;

        // Append the row to the CSV file
        fs.appendFileSync("results.csv", csvRow);

        console.log(`Saved product: ${name}`);
      })
    );

    const nextButton = await findElement(page, TOKOPEDIA.NEXT_BUTTON_XPATH);
    await nextButton.click();
  }

  console.log("All products have been saved to products.csv");

  // Close browser
  await page.browser().close();
})();
