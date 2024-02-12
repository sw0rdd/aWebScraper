import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Logs the user in and returns the HTML content of the booking page
 * @param {string} baseURL url to the dinner page
 * @param {string} username username to login with
 * @param {string} password password to login with
 * @returns {string} HTML content of the booking page
 */
async function loginAndGetBookingPage (baseURL, username, password) {
  const body = new URLSearchParams({
    username,
    password
  }).toString()

  const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  // Login request
  try {
    const loginResponse = await axiosInstance.post(`${baseURL}login/`, body, {
      maxRedirects: 0, // Prevent automatic redirects to manually handle cookies
      validateStatus: function (status) {
        return status >= 200 && status < 303 // Accept redirects as successful responses
      }
    })

    // Extract the Set-Cookie header from the login response
    const cookies = loginResponse.headers['set-cookie']

    // If there's a redirect, the booking page content is fetched using the cookie
    if (cookies) {
      const bookingResponse = await axios.get(`${baseURL}login/booking`, {
        headers: { Cookie: cookies.join('; ') }
      })

      // Parse the HTML content of the booking page
      const bookingHtml = bookingResponse.data

      return bookingHtml
    } else {
      throw new Error('Login failed or no redirect.')
    }
  } catch (error) {
    throw new Error(`Failed to get booking page: ${error.message}`)
  }
}

/**
 * Returns the available dinner slots from the HTML
 * @param {string} html - HTML content of the booking page
 * @returns {object} Object containing available dinner slots
 */
function getAvailableDinnerSlots (html) {
  const $ = cheerio.load(html)
  const availableSlots = {
    Friday: [],
    Saturday: [],
    Sunday: []
  }

  // Define a mapping from sections to days based on the structure.
  const sectionToDayMapping = {
    WordSection2: 'Friday',
    WordSection4: 'Saturday',
    WordSection6: 'Sunday'
  }

  Object.entries(sectionToDayMapping).forEach(([sectionClass, day]) => {
    $(`.${sectionClass} p.MsoNormal`).each((index, elem) => {
      const text = $(elem).text().trim()

      if (text.includes('Free')) {
        // add only time slots without free word
        availableSlots[day].push(text.split(' Free')[0])
      }
    })
  })

  return availableSlots
}

/**
 * Returns true if the dinner slot is at least 2 hours after the movie start time
 * @param {string} movieStartTime - in the format 'HH:MM'
 * @param {string} dinnerSlotRange - in the format 'HH:MM-HH:MM'
 * @returns {boolean} true if the dinner slot is at least 2 hours after the movie start time
 */
function isDinnerSlotAfterMovie (movieStartTime, dinnerSlotRange) {
  // Parse the movie start time
  const [movieStartHour, movieStartMinute] = movieStartTime.split(':').map(Number)
  const movieStartDateTime = new Date(1970, 0, 1, movieStartHour, movieStartMinute)

  // Parse the dinner slot range
  const [dinnerStart] = dinnerSlotRange.split('-').map(time => {
    const [hour, minute = '00'] = time.split(':').map(Number) // Default minutes to '00' if not specified
    return new Date(1970, 0, 1, hour, minute)
  })

  // Check if the dinner start time is at least 2 hours after the movie start time
  const twoHoursInMillis = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  return (dinnerStart - movieStartDateTime) >= twoHoursInMillis
}

export { loginAndGetBookingPage, getAvailableDinnerSlots, isDinnerSlotAfterMovie }
