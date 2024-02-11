const fetch = require('node-fetch');
const cheerio = require('cheerio');


async function fetchHTML(url) {
    const response = await fetch(url)
    const html = await response.text()
    return html
}

async function fetchMovieTitles(url) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const movieTitles = {};

    $('select[name="movie"] option').each((index, element) => {
        const value = $(element).attr('value');
        const title = $(element).text();

        if (value && /^\d+$/.test(value)) {
            movieTitles[value] = title;
        }
    })
    return movieTitles;
}


async function fetchMovieFreeSlots(days, url) {
    const movieTitles = await fetchMovieTitles(url);
    let availableMovieSlots = [];

    for (const day of days) {
        const movieIds = Object.keys(movieTitles);

        for (const movieId of movieIds) {
            const checkUrl = `${url}/check?day=${day}&movie=${movieId}`;
            const response = await fetch(checkUrl);
            const data = await response.json();

            // Filter for available movies with status 1
            const availableMovies = data.filter(movie => movie.status === 1).map(movie => ({
                ...movie,
                movie: movieTitles[movie.movie],
                day: day 
            }));

            availableMovieSlots.push(...availableMovies);
        }
    }

    return availableMovieSlots;
}


module.exports = {
    fetchMovieFreeSlots
};


