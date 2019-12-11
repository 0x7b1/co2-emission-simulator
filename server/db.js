import Influx from 'influx';

const db = new Influx.InfluxDB({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  schema: [
    {
      measurement: 'vehicles',
      fields: {
        lat: Influx.FieldType.FLOAT,
        lng: Influx.FieldType.FLOAT,
        co2: Influx.FieldType.FLOAT,
      },
      tags: [
        'veh_id',
        'scenario',
      ],
    },
  ],
});

export default db;
