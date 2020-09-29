const googleNewsScraper = require('./index.js');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Scrape story IDs from google news homepage

const grabStoryIds = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({ width: 1366, height: 768 });
  page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
  );
  page.setRequestInterception(true);
  page.on('request', request => {
    if (!request.isNavigationRequest()) {
      request.continue();
      return;
    }
    const headers = request.headers();
    headers['Accept'] =
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3';
    headers['Accept-Encoding'] = 'gzip';
    headers['Accept-Language'] = 'en-US,en;q=0.9,es;q=0.8';
    headers['Upgrade-Insecure-Requests'] = 1;
    headers['Referer'] = 'https://www.google.com/';
    request.continue({ headers });
  });
  await page.goto('https://news.google.com/topstories', {
    waitUntil: 'networkidle2'
  });

  const content = await page.content();
  const $ = cheerio.load(content);
  const fullCoverageLinks = $('c-wiz .FKF6mc'); //uh oh very brittle

  let results = [];
  $(fullCoverageLinks).each(function() {
    results.push(
      $(this)
        .attr('href')
        .match(/stories\/([\s\S]*?)\?/)[1]
    ); // This needs to be split to only include the ID
  });
  return results;
};

const grabStoryLinks = async storyId => {
  const articles = await googleNewsScraper({
    storyId: storyId
  });
  return articles;
};
const run = async () => {
  const storyIds = await grabStoryIds();
  const links = {};

  for (let i = 0; i < storyIds.length; i++) {
    const storyLinks = await grabStoryLinks(storyIds[i]);
    links[storyIds[i]] = storyLinks;
  }
  console.log(links);
  // Next up: feed each link into article parser and add post content into the object for that post, then stuff it all
  // in a csv
};
run();
