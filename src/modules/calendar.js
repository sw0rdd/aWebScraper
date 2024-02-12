// Description: This file contains the functions to fetch and parse the calendar data from the given url

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

/**
 * fetches HTML from the given url
 * @param {string} url - url to fetch HTML from
 * @returns {string} HTML from the given url
 */
async function fetchHTML (url) {
  const response = await fetch(url)
  const html = await response.text()
  return html
}

/**
 * Parses the calendar and returns free days of each friend
 * @param {string} url - calendar url
 * @returns {object} free days of each friend
 */
async function parseCalendar (url) {
  const html = await fetchHTML(url)
  const $ = cheerio.load(html)

  const availability = {
    Friday: false,
    Saturday: false,
    Sunday: false
  }

  $('table.striped.centered.responsive-table tbody tr td').each((index, element) => {
    const dayStatus = $(element).text().trim()
    // update availability based on the index
    if (dayStatus.toLowerCase() === 'ok') {
      if (index === 0) {
        availability.Friday = true
      } else if (index === 1) {
        availability.Saturday = true
      } else if (index === 2) {
        availability.Sunday = true
      }
    }
  })
  return availability
}

/**
 * fetches links to each friends calendar from the given url
 * @param {string} url calendar url
 * @returns {Array} links to each friends calendar
 */
async function fetchCalendarLinks (url) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)
  const calendarLinks = []

  const baseURL = url

  $('div.col.s12.center ul li a').each((index, element) => {
    const relativePath = $(element).attr('href')
    const fullURL = new URL(relativePath, baseURL).href
    calendarLinks.push(fullURL)
  })
  return calendarLinks
}

/**
 * Finds common free days of all friends
 * @param {string} url - calendar url
 * @returns {Array} common free days of all friends
 */
async function findCommonFreeDays (url) {
  // get calendar links
  const urls = await fetchCalendarLinks(url)

  const availabilities = await Promise.all(urls.map(url => parseCalendar(url)))

  const commonAvailability = {
    Friday: true,
    Saturday: true,
    Sunday: true
  }

  availabilities.forEach(availability => {
    Object.keys(commonAvailability).forEach(day => {
      if (!availability[day]) {
        commonAvailability[day] = false
      }
    })
  })

  // filter and save only the days when all friends are free
  const commonFreeDays = Object.keys(commonAvailability).filter(day => commonAvailability[day])

  if (commonFreeDays.length === 0) {
    console.log('No common free days found')
  }

  return commonFreeDays
}

/**
 * converts days to numbers
 * @param {Array} days - days as strings
 * @returns {string} days as numbers 05 for Friday, 06 for Saturday and 07 for Sunday
 */
function getDaysAsNumbers (days) {
  const dayToNumberMap = {
    Friday: '05',
    Saturday: '06',
    Sunday: '07'
  }
  return days.map(day => dayToNumberMap[day])
}

/**
 * converts day number to day name
 * @param {string} dayNumber - day number as string
 * @returns {string} day name
 */
function getDayName (dayNumber) {
  const numberToDayMap = {
    '05': 'Friday',
    '06': 'Saturday',
    '07': 'Sunday'
  }
  return numberToDayMap[dayNumber]
}

export { findCommonFreeDays, getDaysAsNumbers, getDayName }
