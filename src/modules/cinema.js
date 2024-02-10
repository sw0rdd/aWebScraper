const fetch = require('node-fetch');

async function fetchMovieFreeSlots(day) {
    const movieIds = ['01', '02', '03'];
    const availableMovieSlots = [];

    for (const movieId of movieIds) {
        const url = `https://courselab.lnu.se/scraper-site-1/cinema/check?day=${day}&movie=${movieId}`;
        const response = await fetch(url);
        const data = await response.json();

        // filter for available movies with status 1
        const availableMovies = data.filter(movie => movie.status === 1);
        availableMovieSlots.push(...availableMovies);
    }
    return availableMovieSlots;
}

fetchMovieFreeSlots('05').then(availability => {
    console.log(availability);
});