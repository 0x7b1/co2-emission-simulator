import chain from 'lodash/chain.js';

import mockData from './mock-data.js';

async function addVehicleStep(req, res) {
  const { db, wsBroadcast } = req;
  const { veh_id, lat, lng, speed } = req.body;

  const newVehicleStep = {
    lat,
    lng,
    speed,
  };

  const newVehiclePoint = [{
    measurement: 'vehicles',
    tags: { veh_id },
    fields: newVehicleStep,
  }];

  try {
    wsBroadcast({
      veh_id,
      ...newVehicleStep,
    });
    // await db.writePoints(newVehiclePoint);

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
        speed,
        (speed * 3) AS co2
      FROM vehicles
      GROUP BY veh_id
    `);

    res.json(result.groups());
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
