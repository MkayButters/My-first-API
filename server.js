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

app.get('/trails', handleTrails)



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
                console.log("found in database")
                console.log(results.rows)
                response.status(200).send(results.rows[0])
            }
            else {
                //the city was not in the database
                console.log('this is the else block')
                let key = process.env.GEOCODE_API_KEY;
                const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
                return superagent.get(url)
                    .then(data => {
                        const geoData = data.body[0]; // first one ...
                        const location = new Location(city, geoData);
                        //this is where we need to store the location info into the database
                        //before we respond
                        response.json(location)
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
    console.log(request.query)

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


client.connect().then(
    app.listen(PORT, () => {
        console.log(`server up: ${PORT}`);
    }))
    .catch(error => {
        console.error(error)
    });

