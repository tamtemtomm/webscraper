export const TOKOPEDIA = {
  HOMEPAGE_LINK: `https://www.tokopedia.com/`,
  SEARCH_BAR_XPATH: `//input[@type="search" and @aria-label="Cari di Tokopedia"]`,
  PRODUCT_XPATH: `//a[contains(@data-theme, "default")]`,
  PRODUCT_NAMES_XPATH: `//a[contains(@data-theme, "default")]/div/div/div[1]/span[1]`,
  PRODUCT_PRICES_XPATH: `//a[contains(@data-theme, "default")]/div/div/div[2]/div[1]`,
  PRODUCT_IMAGES_XPATH: `//a[contains(@data-theme, "default")]//img[@alt="product-image"]`,
  NEXT_BUTTON_XPATH: `//button[@aria-label="Laman berikutnya"]`,
  PRODUCT_DATA_XPATH: {
    NAME: `//h1[@data-expanded][@data-testid]`,
    PRICE: `//div[@class="price"][@data-testid]`,
  },
};
