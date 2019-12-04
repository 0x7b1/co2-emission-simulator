async function saveVehicleTimestamp(req, res) {
  const { db } = req;
  const { id, lat, lng, speed } = req.body;

  const newVehiclePoint = [{
    measurement: 'vehicles',
    fields: {
      id,
      lat,
      lng,
      speed,
    },
  }];

  try {
    await db.writePoints(newVehiclePoint);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
}

async function getVehiclesData(req, res) {
  const { db } = req;

  try {
    const data = await db.query('SELECT lat, lng, (speed / 10) as "speed" FROM vehicles');
    res.json(data);
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

export default {
  saveVehicleTimestamp,
  getVehiclesData,
  cleanData,
};
