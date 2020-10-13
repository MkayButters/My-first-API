'use strict'

require('dotenv').config();

const express = require('express');

const cors = require('cors');

const app = express();

const PORT = process.env.PORT;

app.use(cors());

app.get('/' , (request, response) => {
    response.send('my homepage');
});

app.get('/seattle' , (request, response) => {
    response.json({location: 'seattle', temp: '-12 deg'})
});

app.get('/location', handleLocation);

function Location(city , geoData) {

this.search_query = city;
this.formatted_query = geoData[0].display_name;
this.latitude = geoData[0].lat
this.longitude = geoData[0].lon
}

function handleLocation(request, response) {
try {
    const geoData = require ('./data/location.json');
    const city = request.query.city
    const locationData = new Location(city, geoData)
    response.json(locationData);
} catch {
    response.status(500).send('sorry something broke.');
    }
}
app.get('*', (request, response) => {
    response.status(404).send('not found')
});
