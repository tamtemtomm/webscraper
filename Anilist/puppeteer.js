import fs from "fs";
import { sleep, logger } from "../utils/utils.js";
import {
  initializePage,
  findElements,
  findElement,
} from "../utils/puppeteer.js";
import { ANILIST } from "./config.js";

(async () => {
  const ANIME_COUNT = 100;
  const RESULT_PATH = "./Anilist/results.csv";
  const DELIMITER = ";";

  // Write the header
  fs.writeFileSync(
    RESULT_PATH,
    `${Object.keys(ANILIST.ANIME_DATA).join(DELIMITER)}\n`
  );

  logger(`Initializing the page...`);
  const page = await initializePage();
  await page.goto(ANILIST.HOMEPAGE_LINK, { waitUntil: "networkidle2" });
  logger(`Page initialized...`);

  await sleep(200);

  let animes = [];

  logger(`Getting ${ANIME_COUNT} anime links...`);
  while (animes.length < ANIME_COUNT) {
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });

    await sleep(200); // Give time for new elements to load

    animes = await findElements(page, ANILIST.ANIME_XPATH);

    // Log the progress
    animes.length < ANIME_COUNT &&
      logger(`Got ${animes.length} links, ${ANIME_COUNT - animes.length} more`);
  }

  // Extract links
  const links = await Promise.all(
    animes.map(async (anime) => {
      const href = await anime
        .getProperty("href")
        .then((href) => href.jsonValue());
      return href;
    })
  );
  await page.browser().close();
  logger(`Got ${ANIME_COUNT} links!`);

  for (const link of links) {
    try {
      logger(`Getting data for ${link}...`);

      const page2 = await initializePage();
      await page2.goto(link);
      await sleep(2000);

      const results = await Promise.all(
        Object.entries(ANILIST.ANIME_DATA).map(async ([key, xpath]) => {
          try {
            if (key === "imageUrl") {
              const el = await findElement(page2, xpath);
              const srcProp = await el.getProperty("src");
              return [key, await srcProp.jsonValue()];
            } else {
              const el = await findElement(page2, xpath);
              let text = await el.evaluate((el) => el.innerText);

              if (key == "description") text = text.split("\n")[0];

              return [key, text];
            }
          } catch (error) {
            throw error;
          }
        })
      );

      // Convert result pairs into an object
      logger(`Got : ${JSON.stringify(Object.fromEntries(results))}`);
      fs.appendFileSync(
        RESULT_PATH,
        `${results.map((result) => result[1]).join(DELIMITER)}\n`
      );
      await page2.browser().close();
    } catch (error) {
      logger(`Error in extracting data in ${link} : ${error}`, "ERROR");
      continue;
    }
  }
})();
