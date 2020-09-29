const googleNewsScraper = require('./index.js');

// Scrape story IDs from google news homepage

const grabStoryLinks = async storyId => {
  const articles = await googleNewsScraper({
    storyId: storyId
  });

  // grab the latest 20 articles. maybe filter by known sorces?
  //
  // feed each one to article-parser. save to csv as a set of texts with same content
  // and maybe save source fore ach as well!
};
run();
