import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";

import { TOKOPEDIA } from "./config.js";

const PROMPT = "sepatu";

const csvStream = fs.createWriteStream("results.csv", { flags: "w" });
csvStream.write("Name;Price;Link;Image\n"); // CSV header

const readline = await import("readline");
let stop = false;

const initializeDriver = async () => {
  const options = new chrome.Options();

  options.setPageLoadStrategy("eager");

  // Headless with spoofing
  // options.addArguments("--headless=chrome"); // More compatible than --headless=new
  options.addArguments("--window-size=1920,1080");
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");

  // Spoof User-Agent
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  // Override navigator.webdriver and similar checks
  await driver.executeScript(`
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  `);

  return driver;
};

const driverFindElement = async (driver, xpath) => {
  await driver.wait(until.elementLocated(By.xpath(xpath)), 10000);
  return await driver.findElement(By.xpath(xpath));
};

const driverFindElements = async (driver, xpath) => {
  await driver.wait(until.elementsLocated(By.xpath(xpath)), 10000);
  return await driver.findElements(By.xpath(xpath));
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

const run = async () => {
  setupKeyListener();
  const driver = await initializeDriver();

  try {
    await driver.get(TOKOPEDIA.HOMEPAGE_LINK);
    await new Promise((r) => setTimeout(r, 5000));

    const searchBar = await driverFindElement(
      driver,
      TOKOPEDIA.SEARCH_BAR_XPATH
    );
    await driver.wait(until.elementIsVisible(searchBar), 2000);
    await searchBar.sendKeys(PROMPT, Key.RETURN);

    while (!stop) {
      await new Promise((r) => setTimeout(r, 5000));
      for (let i = 0; i < 6; i++) {
        await driver.executeScript("window.scrollBy(0, 1000);");
        await new Promise((r) => setTimeout(r, 500));
      }

      await driver.wait(
        until.elementsLocated(By.xpath(TOKOPEDIA.PRODUCT_NAMES_XPATH)),
        10000
      );
      await driver.wait(
        until.elementsLocated(By.xpath(TOKOPEDIA.PRODUCT_PRICES_XPATH)),
        10000
      );
      await driver.wait(
        until.elementsLocated(By.xpath(TOKOPEDIA.PRODUCT_IMAGES_XPATH)),
        10000
      );

      const productLinks = await driverFindElements(
        driver,
        TOKOPEDIA.PRODUCT_XPATH
      );
      const productNames = await driverFindElements(
        driver,
        TOKOPEDIA.PRODUCT_NAMES_XPATH
      );
      const productPrices = await driverFindElements(
        driver,
        TOKOPEDIA.PRODUCT_PRICES_XPATH
      );

      const productImages = await driverFindElements(
        driver,
        TOKOPEDIA.PRODUCT_IMAGES_XPATH
      );

      const count = Math.min(
        productLinks.length,
        productNames.length,
        productPrices.length
      );
      for (let i = 0; i < count; i++) {
        const name = await productNames[i].getText();
        const price = await productPrices[i].getText();
        const priceFloat = parseFloat(price.replace(/[^\d]/g, ""));
        const link = await productLinks[i].getAttribute("href");
        const img = await productImages[i].getAttribute("src");
  
        const clean = (text) => text.replace(/"/g, '""'); // escape quotes
        csvStream.write(
          `"${clean(name)}";"${priceFloat}";"${clean(link)}";"${clean(img)}"\n`
        );

        console.log({ name, priceFloat, link, img });
      }

      // Try to go to the next page
      try {
        const nextButton = await driverFindElement(
          driver,
          TOKOPEDIA.NEXT_BUTTON_XPATH
        );
        await driver.executeScript(
          "arguments[0].scrollIntoView(true);",
          nextButton
        );
        await driver.wait(until.elementIsVisible(nextButton), 5000);
        await driver.wait(until.elementIsEnabled(nextButton), 5000);

        const disabled = await nextButton.getAttribute("disabled");
        if (disabled) {
          console.log("Next button is disabled. Ending.");
          break;
        }

        await new Promise((r) => setTimeout(r, 500)); // slight delay
        await driver.executeScript("arguments[0].click();", nextButton);
        console.log("Clicked next page.");
      } catch (e) {
        console.log("Next button not found or not clickable:", e);
        break;
      }
    }

  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    await driver.quit();
    process.exit();
  }
};

run();
