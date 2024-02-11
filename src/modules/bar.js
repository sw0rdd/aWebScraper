const cheerio = require('cheerio');
const nodeFetch = require('node-fetch');
const fetchCookie = require('fetch-cookie');
const fetch = fetchCookie(nodeFetch);
const tough = require('tough-cookie');

const cookieJar = new tough.CookieJar();




async function loginAndGetBookingPage(url, userName, passWord) {
    const loginURL = `${url}/login`;

    const loginResponse = await fetch(loginURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${userName}&password=${passWord}`,
        redirect: 'manual',
        cookieJar,
    });

    const redirectURL = loginResponse.headers.get('location');

    if (redirectURL) {
        const bookingResponse = await fetch(redirectURL, {
            method: 'GET',
            cookieJar,
        });

        const bookingHTML = await bookingResponse.text();
        return bookingHTML;
    } else {
        throw new Error('Redirect URL not found.');
    }
}

function getAvailableDinnerSlots(html) {
    const $ = cheerio.load(html);
    const availableSlots = {
        'Friday': [],
        'Saturday': [],
        'Sunday': []
    };

    // Define a mapping from sections to days based on the structure.
    const sectionToDayMapping = {
        'WordSection2': 'Friday',
        'WordSection4': 'Saturday',
        'WordSection6': 'Sunday'
    };

    Object.entries(sectionToDayMapping).forEach(([sectionClass, day]) => {
        $(`.${sectionClass} p.MsoNormal`).each((index, elem) => {
            const text = $(elem).text().trim();

            if (text.includes('Free')) {
                // add only time slots without free word
                availableSlots[day].push(text.split(' Free')[0]);
            }
        });
    });

    return availableSlots;
}


module.exports = {
    loginAndGetBookingPage,
    getAvailableDinnerSlots
};
