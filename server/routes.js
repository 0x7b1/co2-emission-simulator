import influx from 'influx';
const { Precision } = influx;
import fs from 'fs';

import mockData from './mock-data.js';

// Meters per second to Miles per hour
function msTomh(ms) {
  return 2.23693629 * ms;
}

function calculateCO(speed) {
  if (speed < 0) return 0;
  // return speed * 10;
  // return Number(speed);
  const vm = msTomh(speed);
  const p = -0.064 + 0.0056 * vm + 0.00026 * Math.pow(vm - 50, 2); // g/s

  return p * 1000; // mg/s
}

const emissionClass = {
  PC_G_EU4: [9449, 938.4, 0.0, -467.1, 28.26, 0.0], // gasoline driven passenger car Euro norm 4
  HDV_D_EU0: [3.251e+04, 7256, 0.0, 1631, 0.0, 0.0], // diesel driven heavy duty vehicle Euro norm 0
};

function calculateCO2(s, a, c = 'PC_G_EU4') {
  if (a < 0) return 0;

  let scale = 3.6;
  // if (c.includes('HDV')) {
  //   scale *= 836.;
  // }

  const f = emissionClass[c];
  const co2 = f[0] + f[1] * a * s + f[2] * a * a * s + f[3] * s + f[4] * s * s + f[5] * s * s * s;

  return Math.max(co2 / scale, 0.0);
}

const BASE_DATE = new Date(2019, 11, 9, 6).getTime();

const logger = fs.createWriteStream('emissions.csv');
logger.write('sumo,form\n');
// logger.close()

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
    acc,
    co2,
    time_offset_sec,
    scenario,
  } = req.body;

  const newVehicleStep = {
    co2: calculateCO2(speed, acc),
    lat: Number(lat),
    lng: Number(lng),
    // speed,
  };

  // console.log('%s,%s', co2, newVehicleStep.co2);
  // logger.write(co2 + ',' + newVehicleStep.co2 + '\n');
  console.log(JSON.stringify(newVehicleStep) + ',\n');

  const newVehiclePoint = {
    measurement: 'vehicles',
    precision: Precision.Seconds,
    tags: {
      veh_id,
      scenario,
    },
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
  const { scenario = 'simple' } = req.query;

  try {
    const result = await db.query(`
      SELECT
        time,
        veh_id,
        lat,
        lng,
        co2
      FROM vehicles
      WHERE scenario = '${scenario}'
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
