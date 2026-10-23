const express = require('express');
const actor = require('./middlewares/actor');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', actor, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
