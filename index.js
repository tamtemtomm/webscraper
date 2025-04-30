import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";

import { TOKOPEDIA } from "./config.js";

const searchPrompt = "sepatu";

const csvStream = fs.createWriteStream("results.csv", { flags: "w" });
csvStream.write("Name,Price,Link,Image\n"); // CSV header

const readline = await import("readline");
let stop = false;

const initializeDriver = async () => {
  const options = new chrome.Options();
  options.setPageLoadStrategy("eager");
  return await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
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
  const results = [];
  const driver = await initializeDriver();

  try {
    await driver.get(TOKOPEDIA.HOMEPAGE_LINK);
    await new Promise((r) => setTimeout(r, 5000));

    const searchBar = await driverFindElement(
      driver,
      TOKOPEDIA.SEARCH_BAR_XPATH
    );
    await driver.wait(until.elementIsVisible(searchBar), 3000);
    await searchBar.sendKeys(searchPrompt, Key.RETURN);

    while (!stop) {
      await new Promise((r) => setTimeout(r, 3000));
      for (let i = 0; i < 5; i++) {
        await driver.executeScript("window.scrollBy(0, 1000);");
        await new Promise((r) => setTimeout(r, 1000));
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
        results.push({ name, priceFloat, link, img });
        console.log({ name, priceFloat, link, img });

        const clean = (text) => text.replace(/"/g, '""'); // escape quotes

        csvStream.write(
          `"${clean(name)}","${priceFloat}","${clean(link)}","${clean(img)}"\n`
        );

        console.log({ name, priceFloat, link, img });
      }

      // Try to go to the next page
      try {
        const nextButton = await driverFindElement(
          driver,
          TOKOPEDIA.NEXT_BUTTON_XPATH
        );
        await driver.wait(until.elementIsVisible(nextButton), 5000);
        await driver.wait(until.elementIsEnabled(nextButton), 5000);
        await driver.executeScript("arguments[0].click();", nextButton);
      } catch (e) {
        console.log("Next button not found or not clickable.");
        break;
      }
    }

    console.log("\nFinal Results:");
    console.log(results);
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    await driver.quit();
    process.exit();
  }
};

run();
