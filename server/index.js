import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import routes from './routes.js';
import db from './db.js';

const app = express();

// Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
const apiRouter = express.Router();
apiRouter.route('/vehicles/timestamp')
  .post(routes.saveVehicleTimestamp);

apiRouter.route('/vehicles')
  .get(routes.getVehiclesData);

apiRouter.route('/clean')
  .get(routes.cleanData);

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(500).json({ message: 'Internal error' });
});

// Connection
(async () => {
  const names = await db.getDatabaseNames();
  if (!names.includes(process.env.DB_NAME)) {
    console.log('No database found and created');
    await db.createDatabase(process.env.DB_NAME);
  }

  app.listen(process.env.APP_PORT,
    () => console.info(`Up on http://127.0.0.1:${process.env.APP_PORT}/`));
})();
