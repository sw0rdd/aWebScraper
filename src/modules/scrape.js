const fetch = require('node-fetch')
const cheerio = require('cheerio')

const { findCommonFreeDays } = require('./calendar')
const { fetchMovieFreeSlots } = require('./cinema')

const { loginAndGetBookingPage, getAvailableDinnerSlots } = require('./bar')




/**
 * fetches links from the given url
 * @param {string} url 
 * @returns scraped links from the given url
 */
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

/**
 * converts days to numbers
 * @param {array} days 
 * @returns days as numbers 05 for Friday, 06 for Saturday and 07 for Sunday
 */
function getDaysAsNumbers(days) {
  const dayToNumberMap = {
    'Friday': '05',
    'Saturday': '06',
    'Sunday': '07',
  }
  return days.map(day => dayToNumberMap[day]);
}

/**
 * converts day number to day name
 * @param {string} dayNumber 
 * @returns day name
 */
function getDayName(dayNumber) {
  const numberToDayMap = {
    '05': 'Friday',
    '06': 'Saturday',
    '07': 'Sunday',
  }
  return numberToDayMap[dayNumber];
}






function isDinnerSlotAfterMovie(movieStartTime, dinnerSlotRange) {
    // Parse the movie start time
    const [movieStartHour, movieStartMinute] = movieStartTime.split(':').map(Number);
    const movieStartDateTime = new Date(1970, 0, 1, movieStartHour, movieStartMinute);

    // Parse the dinner slot range
    const [dinnerStart, dinnerEnd] = dinnerSlotRange.split('-').map(time => {
        const [hour, minute = '00'] = time.split(':').map(Number); // Default minutes to '00' if not specified
        return new Date(1970, 0, 1, hour, minute);
    });

    // Check if the dinner start time is at least 2 hours after the movie start time
    const twoHoursInMillis = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    return (dinnerStart - movieStartDateTime) >= twoHoursInMillis;
}




async function main() {
  const links = await fetchLinks('https://courselab.lnu.se/scraper-site-2/')
  const calendar = links[0];
  const cinema = links[1];
  const dinner = links[2];

  const commonFreeDaysCode = await findCommonFreeDays(calendar);
  const dayNumbers = getDaysAsNumbers(commonFreeDaysCode);

  const movieTitlesandSlots = await fetchMovieFreeSlots(dayNumbers, cinema);


  const bookingPage = await loginAndGetBookingPage(dinner, 'zeke', 'coys');
  const dinnerSlots = getAvailableDinnerSlots(bookingPage);


  console.log('Recommendations\n=====================')

  dayNumbers.forEach(dayNumber => {
    const dayName = getDayName(dayNumber);
    const moviesThatDay = movieTitlesandSlots.filter(slot => slot.day === dayNumber);
    const dinnerSlotsThatDay = dinnerSlots[dayName] || [];

    moviesThatDay.forEach(movie => {
      // No longer calculating movie end time since it's not required
      dinnerSlotsThatDay.forEach(dinnerSlot => {
        if (isDinnerSlotAfterMovie(movie.time, dinnerSlot)) {
          console.log(`* On ${dayName} the movie "${movie.movie}" starts at ${movie.time} and there is a free table between ${dinnerSlot}.`);
        }
      });
    });
  });
}

main().catch(console.error)










