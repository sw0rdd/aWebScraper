import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

import { findCommonFreeDays, getDaysAsNumbers, getDayName } from './modules/calendar.js'
import { fetchMovieFreeSlots } from './modules/cinema.js'
import { loginAndGetBookingPage, getAvailableDinnerSlots, isDinnerSlotAfterMovie } from './modules/bar.js'

/**
 * fetches links from the given url
 * @param {string} url - url to fetch links from
 * @returns {Array} scraped links from the given url
 */
async function fetchLinks (url) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)
  const links = []

  $('a').each((index, element) => {
    const link = $(element).attr('href')
    // Check if the link is absolute
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      links.push(link)
    }
  })
  return links
}

/**
 * Fetches and logs recommendations to terminal based on the given links
 */
async function main () {
  const urls = process.argv.slice(2)
  if (urls.length === 0) {
    console.error('ERROR: No argument(s).')
    process.exit(1)
  }

  try {
    const links = await fetchLinks(urls)
    console.log('Scraping links...ok')

    const calendar = links[0]
    const cinema = links[1]
    const dinner = links[2]

    const commonFreeDaysCode = await findCommonFreeDays(calendar)
    console.log('Scraping available days...ok')
    const dayNumbers = getDaysAsNumbers(commonFreeDaysCode)

    const movieTitlesandSlots = await fetchMovieFreeSlots(dayNumbers, cinema)
    console.log('Scraping showtimes...ok')

    const bookingPage = await loginAndGetBookingPage(dinner, 'zeke', 'coys')
    const dinnerSlots = getAvailableDinnerSlots(bookingPage)
    console.log('Scraping possible reservations...ok')

    console.log('\nRecommendations\n=====================')

    dayNumbers.forEach(dayNumber => {
      const dayName = getDayName(dayNumber)
      const moviesThatDay = movieTitlesandSlots.filter(slot => slot.day === dayNumber)
      const dinnerSlotsThatDay = dinnerSlots[dayName] || []

      moviesThatDay.forEach(movie => {
        // No longer calculating movie end time since it's not required
        dinnerSlotsThatDay.forEach(dinnerSlot => {
          if (isDinnerSlotAfterMovie(movie.time, dinnerSlot)) {
            console.log(`* On ${dayName} the movie "${movie.movie}" starts at ${movie.time} and there is a free table between ${dinnerSlot}.`)
          }
        })
      })
    })
  } catch (error) {
    console.error('Error during scraping: ', error)
  }
}

main().catch(console.error)
