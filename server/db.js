import Influx from 'influx';

const db = new Influx.InfluxDB({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  schema: [
    {
      measurement: 'vehicles',
      fields: {
        id: Influx.FieldType.STRING,
        lat: Influx.FieldType.STRING,
        lng: Influx.FieldType.STRING,
        speed: Influx.FieldType.INTEGER,
      },
      tags: [],
    },
  ],
});

export default db;
