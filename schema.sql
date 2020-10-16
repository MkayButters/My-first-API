DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
  );

-- DROP TABLE IF EXISTS weather;

CREATE TABLE weather (
    id SERIAL PRIMARY KEY,
    weather VARCHAR(255),
    valid_date VARCHAR(255)
);



DROP TABLE IF EXISTS trails;

CREATE TABLE trails( 
    id SERIAL PRIMARY KEY,
    names VARCHAR(255),
    locations VARCHAR(255),
    lengths VARCHAR(255),
    stars VARCHAR(255),
    starVotes VARCHAR(255),
    summary VARCHAR(255),
    urls VARCHAR(255),
    conditionDetails VARCHAR(255),
    conditionDate VARCHAR(255)
);
