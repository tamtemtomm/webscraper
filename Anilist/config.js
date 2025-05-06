export const ANILIST = {
  HOMEPAGE_LINK: `https://anilist.co/search/anime/top-100`,
  ANIME_XPATH: `//a[@data-v-4d8937d6][@class="cover"]`,
  ANIME_DATA: {
    title: `//h1[@data-v-5776f768]`,
    imageUrl: `//img[@class="cover"]`,
    // IMAGE_COVER_LARGE_XPATH: `//img[@class="cover"]`,
    description: `//p[@class="description"]`,
    format: `//div[text()="Format"]/../div[@class="value"]`,
    episodes: `//div[text()="Episodes"]/../div[@class="value"]`,
    // duration: `//div[text()="Duration"]/../div[@class="value"]`,
    status: `//div[text()="Status"]/../div[@class="value"]`,
    studios: `//div[text()="Studios"]/../div[@class="value"]`,
    source: `//div[text()="Source"]/../div[@class="value"]`,
  },
};
