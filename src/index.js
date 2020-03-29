const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017/knifecrime';
const dbName = 'knifecrime';
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    await client.connect();
    const db = await client.db(dbName);
    const records = await db.collection('byQuarter').find().toArray();
    console.log('records: %o', records);
  } catch (error) {
    console.error(error.stack);
  }
})();
