import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './app';
import * as serviceWorker from './serviceWorker';

const DATA_URL = 'https://raw.githubusercontent.com/uber-web/kepler.gl-data/master/earthquakes/data.csv'; // eslint-disable-line

require('d3-fetch').csv(DATA_URL).then((response) => {
  const data = response.map(row => ({
    timestamp: new Date(`${row.DateTime} UTC`).getTime(),
    latitude: Number(row.Latitude),
    longitude: Number(row.Longitude),
    depth: Number(row.Depth),
    magnitude: Number(row.Magnitude)
  }));

  ReactDOM.render(<App data={data} />, document.getElementById('root'));
});


serviceWorker.unregister();
// serviceWorker.register();
