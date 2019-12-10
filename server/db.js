import Influx from 'influx';

const db = new Influx.InfluxDB({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  schema: [
    {
      measurement: 'vehicles',
      fields: {
        veh_id: Influx.FieldType.STRING,
        lat: Influx.FieldType.FLOAT,
        lng: Influx.FieldType.FLOAT,
        co2: Influx.FieldType.FLOAT, // mg/s
      },
      tags: [
        'veh_id',
        'scenario',
      ],
    },
  ],
});

export default db;
