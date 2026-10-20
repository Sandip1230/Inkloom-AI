require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/config/db');

const port = process.env.PORT || 3001;

// Safety net: without these, ANY unexpected error anywhere in an async
// function (a rejected promise that isn't caught) kills the whole Node
// process instantly and silently - which looks exactly like "server
// crashed / can't reach the server" from the frontend, with almost no
// clue in the terminal about why. Logging instead of crashing keeps the
// server alive and gives us the real error to debug.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] Server would have crashed. Reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException] Server would have crashed. Error:', error);
});

// Start the HTTP server immediately. The AI pipeline stages (/api/stages/*)
// are stateless and don't touch MongoDB at all - only /api/brand does.
app.listen(port, () => console.log(`Brandloom API listening on port ${port}`));

if (process.env.MONGO_URI) {
  connectDatabase().catch((error) => {
    console.error('MongoDB connection failed - stage routes still work, /api/brand will not:', error.message);
  });
} else {
  console.warn('MONGO_URI not set - /api/brand session persistence is disabled, stage routes still work.');
}