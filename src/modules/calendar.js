const fetch = require('node-fetch')
const cheerio = require('cheerio')

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

  console.log(Object.keys(commonAvailability))

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

module.exports = {
    parseCalendar,
    findCommonFreeDay
};
