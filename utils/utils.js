import fs from "fs";
const readline = await import("readline");

export const setupKeyListener = () => {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (_, key) => {
    if (key.name === "q") {
      console.log("Received 'q'. Stopping the scraper...");
      stop = true;
    }
  });
};

export const intializeWriter = (filePath) => {
  // Initialize the CSV file with headers
  const csvHeader = "Name;Price;Link;Image\n";
  fs.writeFileSync(filePath, csvHeader);
};

export const sleep = async (timeout) => {
  await new Promise((r) => setTimeout(r, timeout));
};

export const logger = (message, type = "INFO") => {
  const now = new Date();
  console.log(`${now.toString().split(' G')[0]}  ${type} : ${message}`);
};
