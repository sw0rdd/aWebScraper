const { parseCalendar, findCommonFreeDay } = require('./modules/calendar');

// parseCalendar('https://courselab.lnu.se/scraper-site-1/calendar/mary.html').then(availability => {
//     console.log(availability);
//     });

const calendarArray = [
    'https://courselab.lnu.se/scraper-site-1/calendar/peter.html',
    'https://courselab.lnu.se/scraper-site-1/calendar/paul.html',
    'https://courselab.lnu.se/scraper-site-1/calendar/mary.html'
    ];
    
findCommonFreeDay(calendarArray).then(commonDays => {
console.log('Days when all friends are free:', commonDays);
});