'use strict'

require('dotenv').config();

const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

const express = require('express');

const superagent = require('superagent');

const cors = require('cors');

const app = express();

const PORT = process.env.PORT;

app.use(cors());

app.get('/', (request, response) => {
    response.send('my homepage');
});
app.get('/location', handleLocation);


app.get('/weather', handleWeather);

app.get('/trails', handleTrails);

app.get('/movies', handleMovies);

app.get('/yelp', handleReviews);

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat
    this.longitude = geoData.lon
}
function handleLocation(request, response) {

    let city = request.query.city;
    let SQL = 'SELECT * FROM locations WHERE search_query=$1';
    let safeValues = [city]

    client.query(SQL, safeValues)
        .then(results => {
            if (results.rows.length > 0) {
                //things were in the database
                response.status(200).send(results.rows[0])
            }
            else {
                //the city was not in the database
                let key = process.env.GEOCODE_API_KEY;
                const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
                return superagent.get(url)
                    .then(data => {
                        const geoData = data.body[0]; // first one ...
                        const location = new Location(city, geoData);
                        //this is where we need to store the location info into the database
                        //before we respond
                        const insertSQL = 'INSERT INTO locations (latitude, longitude, formatted_query, search_query) VALUES ($1 , $2 , $3 , $4)'
                        const insertValues = [location.latitude, location.longitude, location.formatted_query, location.search_query];
                        client.query(insertSQL, insertValues).then(response.json(location));
                    })
                    .catch(() => {
                        return response.status(500).send('So sorry, something went wrong.');
                    });
            }
        })
        .catch(err => {
            console.error('db error:', err);
        })
}
app.get('*', (request, response) => {
    response.status(404).send('not found')
});


function handleWeather(request, response) {

    const url = 'http://api.weatherbit.io/v2.0/forecast/daily';

    const queryParams = {
        lang: "en",
        days: 16,
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: process.env.WEATHER_API_KEY,
    };
    superagent.get(url)
        .query(queryParams)
        .then((data) => {
            const results = data.body;
            const resultsOfWeather = results.data.map(entry => {
                return new Weather(entry)
            });
            response.json(resultsOfWeather)
        })
        .catch((error) => {
            console.log(error, "error")
            response.status(500).send('My sincere apologizes, something went wrong.');
        });
}
function Weather(geoData) {
    this.forecast = geoData.weather.description
    this.time = geoData.valid_date
}

function handleTrails(request, response) {
    const url = `https://www.hikingproject.com/data/get-trails`;
    const queryParams = {
        lat: request.query.latitude,
        lon: request.query.longitude,
        key: process.env.TRAIL_API_KEY,
    };

    superagent.get(url)
        .query(queryParams)
        .then((trails) => {
            const results = trails.body;
            const resultsOfTrails = results.trails.map(entry => {
                return new Trails(entry)
            });
            response.json(resultsOfTrails)
        })
        .catch((error) => {
            console.log(error, "error")
            response.status(500).send('My sincere apologizes, something went wrong.');
        });
}

function Trails(geoData) {
    this.name = geoData.name
    this.location = geoData.location
    this.length = geoData.length
    this.stars = geoData.stars
    this.star_votes = geoData.starVotes
    this.summary = geoData.summary
    this.trail_url = geoData.url
    this.conditions = geoData.conditionDetails
    this.conditions_date_time = geoData.conditionDate
}

function handleMovies(request, response) {
    let location = request.query.search_query
    const url = `https://api.themoviedb.org/3/search/movie/?api_key=${process.env.MOVIE_API_KEY}&language=en-US&page=1&query=${location}`;
    const queryParams = {
        key: process.env.MOVIE_API_KEY,
    };

    superagent.get(url)
        .query(queryParams)
        .then((movies) => {
            const results = movies.body.results;
            const resultsOfMovies = results.map(entry => {
                return new Movies(entry)
            });
            response.json(resultsOfMovies)
        })
        .catch((error) => {
            console.log(error, "error")
            response.status(500).send('My sincere apologizes, something went wrong.');
        });
}

function Movies(geoData) {
    this.title = geoData.title,
        this.overview = geoData.overview,
        this.average_votes = geoData.average_votes,
        this.total_votes = geoData.total_votes,
        this.image_url = geoData.image_url
    this.popularity = geoData.popularity
    this.released_on = geoData.released_on
}


function handleReviews(request, response) {
    let location = request.query.search_query
    let page = parseInt(request.query.page)
    const url = `https://api.yelp.com/v3/businesses/search?location=${location}`;
    const queryParams = {
        key: process.env.YELP_API_KEY,
    };

    superagent.get(url)
        .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
        .query(queryParams)
        .then((reviews) => {
            const results = reviews.body.businesses;
            let pageNumber = 1
            let counter = 1
            let thisPage = []
            results.forEach(entry => {
                if (counter % 5 === 0) pageNumber++
                if (pageNumber === page) {
                    thisPage.push(new Reviews(entry, pageNumber))
                }
                counter++
            });
            console.log(thisPage)
            response.json(thisPage)
        })
        .catch((error) => {
            console.log(error, "error")
            response.status(500).send('My sincere apologizes, something went wrong.');
        });
}


function Reviews(geoData, page) {
    this.name = geoData.name,
        this.image_url = geoData.image_url,
        this.price = geoData.price,
        this.rating = geoData.rating,
        this.url = geoData.url,
        this.page = page
}


client.connect().then(
    app.listen(PORT, () => {
        console.log(`server up: ${PORT}`);
    }))
    .catch(error => {
        console.error(error)
    });

