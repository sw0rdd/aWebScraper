const fetch = require('node-fetch')
const cheerio = require('cheerio')


// fetch single URL and extract links 
async function fetchLinks(url) {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    const links = []

    $('a').each((index, element) => {
        const link = $(element).attr('href');
        // Check if the link is absolute
        if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
          links.push(link);
        }
      });
      return links;
}


async function fetchHTML(url) {
    const response = await fetch(url)
    const html = await response.text()
    return html
}

async function parseCalendar(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  const availability = {
    'Friday': false,
    'Saturday': false,
    'Sunday': false,
  };

  $('table.striped.centered.responsive-table tbody tr td').each((index, element) => {
    const dayStatus = $(element).text().trim();
    console.log(dayStatus, index)
    // update availability based on the index 
    if (dayStatus.toLowerCase() === 'ok') {
      if (index === 0) {
        availability['Friday'] = true;
      } else if (index === 1) {
        availability['Saturday'] = true;
      } else if (index === 2) {
        availability['Sunday'] = true;
      }
    }
  });
  return availability;
}

async function findCommonFreeDay(urls) {
  const availabilities = await Promise.all(urls.map(url => parseCalendar(url)));

  const commonAvailability = {
    'Friday': true,
    'Saturday': true,
    'Sunday': true,
  };

  availabilities.forEach(availability => {
    Object.keys(commonAvailability).forEach(day => {
      if (!availability[day]) {
        commonAvailability[day] = false;
      }
    });
  })

  // filter and return only the days when all friends are free
  return Object.keys(commonAvailability).filter(day => commonAvailability[day]);
}

const calendarArray = [
  'https://courselab.lnu.se/scraper-site-1/calendar/peter.html',
  'https://courselab.lnu.se/scraper-site-1/calendar/paul.html',
  'https://courselab.lnu.se/scraper-site-1/calendar/mary.html'
];

findCommonFreeDay(calendarArray).then(commonDays => {
  console.log('Days when all friends are free:', commonDays);
});



// parseCalendar('https://courselab.lnu.se/scraper-site-1/calendar/mary.html').then(availability => {
//   console.log(availability);
// })

