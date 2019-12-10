import influx from 'influx';
const { Precision } = influx;
// import chain from 'lodash/chain.js';

import mockData from './mock-data.js';

function calculateCO2(speed) {
  // return speed * 10;
  return Number(speed);
}

const BASE_DATE = new Date(2019, 11, 9, 6).getTime();

function getTimeWithOffset(time_offset_sec) {
  const time = new Date(BASE_DATE + time_offset_sec * 1000);
  return time;
}

async function addVehicleStep(req, res) {
  const { db, wsBroadcast } = req;
  const {
    veh_id,
    lat,
    lng,
    speed,
    co2,
    time_offset_sec,
  } = req.body;

  // const co2 = calculateCO2(speed);

  const newVehicleStep = {
    lat: Number(lat),
    lng: Number(lng),
    speed,
    co2: calculateCO2(co2),
  };

  const newVehiclePoint = {
    measurement: 'vehicles',
    precision: Precision.Seconds,
    tags: { veh_id },
    fields: newVehicleStep,
  };

  if (time_offset_sec) {
    Object.assign(newVehiclePoint, {
      timestamp: getTimeWithOffset(time_offset_sec),
    });
  }

  try {
    wsBroadcast({
      veh_id,
      ...newVehicleStep,
    });

    // await db.writePoints([newVehiclePoint]);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
}

async function getVehiclesData(req, res) {
  const { db } = req;

  try {
    const result = await db.query(`
      SELECT
        time,
        veh_id,
        lat,
        lng,
        co2
      FROM vehicles
    `);

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

async function cleanData(req, res) {
  const { db } = req;
  try {
    await db.dropSeries({ measurement: 'vehicles' });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
}

function getMockData(req, res) {
  res.json(mockData);
}

async function createTestData(req, res) {
  const { db } = req;

  try {
    await db.writePoints(mockData);
    res.status(200).end();
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

export default {
  addVehicleStep,
  getVehiclesData,
  cleanData,

  getMockData,
  createTestData,
};
