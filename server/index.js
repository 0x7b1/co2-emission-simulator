import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import WebSocket from 'ws';

import routes from './routes.js';
import db from './db.js';

// Declarations
const app = express();
const ws = new WebSocket.Server({ port: process.env.WS_PORT });

// Setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  req.db = db;
  req.ws = ws;
  req.wsBroadcast = data => {
    ws.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  next();
});

// Routes
const apiRouter = express.Router();
apiRouter.route('/vehicles/step')
  .post(routes.addVehicleStep);

apiRouter.route('/vehicles')
  .get(routes.getVehiclesData);

apiRouter.route('/clean')
  .get(routes.cleanData);

apiRouter.route('/getmock')
  .get(routes.getMockData);

apiRouter.route('/addmock')
  .post(routes.createTestData);

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(500).json({ message: 'Internal error' });
});

// Connections
ws.on('connection', ws => {
  console.log('New ws connection!');

  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  })

  ws.on('close', _ => {
    console.log('Closed socket')
  });
});

(async () => {
  const names = await db.getDatabaseNames();
  if (!names.includes(process.env.DB_NAME)) {
    console.log('No database found and created');
    await db.createDatabase(process.env.DB_NAME);
  }

  app.listen(process.env.APP_PORT,
    () => console.info(`Up on http://127.0.0.1:${process.env.APP_PORT}/`));
})();
