const googleNewsScraper = require('./index.js');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const parser = require('horseman-article-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'out.csv',
  header: [
    { id: 'story', title: 'story' },
    { id: 'content', title: 'content' },
  ],
});

// Scrape story IDs from google news homepage

const grabStoryIds = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({ width: 1366, height: 768 });
  page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
  );
  page.setRequestInterception(true);
  page.on('request', (request) => {
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
    waitUntil: 'networkidle2',
  });

  const content = await page.content();
  const $ = cheerio.load(content);
  const fullCoverageLinks = $('c-wiz .FKF6mc'); //uh oh very brittle

  let results = [];
  $(fullCoverageLinks).each(function () {
    results.push(
      $(this)
        .attr('href')
        .match(/stories\/([\s\S]*?)\?/)[1]
    ); // This needs to be split to only include the ID
  });
  return results;
};

const grabStoryLinks = async (storyId) => {
  const articles = await googleNewsScraper({
    storyId: storyId,
  });
  return articles;
};
const run = async () => {
  console.log('grabbing story ids');
  const storyIds = await grabStoryIds();
  console.log('Grabbed story ids grabbing links');
  const links = {};

  for (let i = 0; i < storyIds.length; i++) {
    const storyLinks = await grabStoryLinks(storyIds[i]);
    links[storyIds[i]] = storyLinks;
    for (link in storyLinks) {
      await csvWriter.writeRecords([
        {
          story: storyIds[i],
          content: storyLinks[link].title,
        },
      ]);

      // const article = await parser.parseArticle({url: storyLinks[link].link})
      // console.log(article.processed.text.formatted)
    }
    console.log('DONE');
  }
  console.log('Finished all stories');
};
run();
