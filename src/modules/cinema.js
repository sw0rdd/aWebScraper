import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

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
 * fetches movie titles from the given url
 * @param {string} url - url to fetch movie titles from
 * @returns {object} movie titles
 */
async function fetchMovieTitles (url) {
  const html = await fetchHTML(url)
  const $ = cheerio.load(html)
  const movieTitles = {}

  $('select[name="movie"] option').each((index, element) => {
    const value = $(element).attr('value')
    const title = $(element).text()

    if (value && /^\d+$/.test(value)) {
      movieTitles[value] = title
    }
  })
  return movieTitles
}

/**
 * fetches available movie slots from the given url
 * @param {Array} days - available days
 * @param {string} url - url to fetch available movie slots from
 * @returns {Array} available movie slots
 */
async function fetchMovieFreeSlots (days, url) {
  const movieTitles = await fetchMovieTitles(url)
  const availableMovieSlots = []

  for (const day of days) {
    const movieIds = Object.keys(movieTitles)

    for (const movieId of movieIds) {
      const checkUrl = `${url}/check?day=${day}&movie=${movieId}`
      const response = await fetch(checkUrl)
      const data = await response.json()

      // Filter for available movies with status 1
      const availableMovies = data.filter(movie => movie.status === 1).map(movie => ({
        ...movie,
        movie: movieTitles[movie.movie],
        day
      }))

      availableMovieSlots.push(...availableMovies)
    }
  }

  return availableMovieSlots
}

export { fetchMovieFreeSlots }
