const scenario = process.env.REACT_APP_SCENARIO || 'simple';
const URL_PATH = 'http://localhost:8080/api/vehicles';

const scenarios = {
  simple: {
    urlData: `${URL_PATH}?scenario=simple`,
    initialPosition: {
      latitude: 58.30079260885314,
      longitude: 26.60045353923848,
    },
  },
  tartu: {
    urlData: `${URL_PATH}?scenario=tartu`,
    initialPosition: {
      latitude: 58.38121869628752,
      longitude: 26.73278172091453,
    },
  },
  monaco: {
    urlData: `${URL_PATH}?scenario=monaco`,
    initialPosition: {
      latitude: 43.72876951717807,
      longitude: 7.381480783579958,
    },
  },
};

const { initialPosition, urlData } = scenarios[scenario];

const config = {
  mapStyle: 'mapbox://styles/mapbox/dark-v9',
  mapboxToken: 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg',
  urlData,
  urlWs: 'ws://localhost:8081/ws',
  co2ColorRange: [
    [42, 163, 100],
    [162, 206, 86],
    [240, 225, 75],
    [222, 191, 68],
    [205, 158, 61],
    [188, 124, 53],
    [171, 91, 46],
    [143, 61, 35],
    [82, 39, 12],
    [56, 29, 2],
  ],
  initialPosition,
}

export default config;
