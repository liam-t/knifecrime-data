const { MongoClient } = require('mongodb');
const { writeToFile } = require('./helpers');

const url = 'mongodb://localhost:27017/knifecrime';
const dbName = 'knifecrime';
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    await client.connect();
    console.log('db connected');
    const db = await client.db(dbName);
    const byQuarterCollection = db.collection('byQuarter');

    const records = await byQuarterCollection.find().toArray();

    const forceNames = await byQuarterCollection.distinct('Region');

    const quarterlyAverages = await byQuarterCollection.aggregate([
      { $group: {
        _id: {
          year: '$financialYear',
          quarter: '$financialQuarter',
        },
        knifeCrime: { $avg: '$knifeCrime' },
      } },
      { $sort: { '_id.year': 1, '_id.quarter': 1 } },
      { $project: {
        _id: 0,
        year: '$_id.year',
        quarter: '$_id.quarter',
        knifeCrime: { $round: ['$knifeCrime', 3] },
      } },
    ]).toArray();

    const regionOverview = await byQuarterCollection.aggregate([
      { $group: {
        _id: {
          region: '$Region',
          financialYear: '$financialYear',
        },
        knifeCrimeYearTotal: { $sum: '$knifeCrime' },
        knifeCrimeQuarterlyAverage: { $avg: '$knifeCrime' },
      } },
      { $sort: { '_id.financialYear': 1 } },
      { $group: {
        _id: '$_id.region',
        years: { $push: {
          year: '$_id.financialYear',
          knifeCrimeYearTotal: '$knifeCrimeYearTotal',
          knifeCrimeQuarterlyAverage: '$knifeCrimeQuarterlyAverage',
        } },
        knifeCrimeTotal: { $sum: '$knifeCrimeYearTotal' },
      }},
      { $project: {
        _id: 0,
        name: '$_id',
        years: 1,
        knifeCrimeTotal: 1,
      } },
      { $sort: { knifeCrimeTotal: 1 } },
    ]).toArray();

    const knifeCrimeDataPointsByRegion = await byQuarterCollection.aggregate([
      { $group: {
        _id: {
          region: '$Region',
          year: '$financialYear',
          quarter: '$financialQuarter',
        },
        knifeCrime: { $sum: '$knifeCrime' },
      } },
      { $sort: {
        '_id.year': 1,
        '_id.quarter': 1,
      } },
      { $group: {
        _id: '$_id.region',
        points: { $push: {
          year: '$_id.year',
          quarter: '$_id.quarter',
          knifeCrime: '$knifeCrime',
        } },
        total: { $sum: '$knifeCrime'},
      } },
      { $project: {
        _id: 0,
        name: '$_id',
        points: 1,
        total: 1,
      } },
      { $sort: { total: 1 } },
    ]).toArray();

    const dataToWrite = {
      forceNames,
      regionOverview,
      quarterlyAverages,
      knifeCrimeDataPointsByRegion,
    };

    // console.log('records: %o', records);

    // writeToFile(dataToWrite, `data/exports/data.json`);
  } catch ({ stack }) {
    console.error(stack);
  } finally {
    client.close();
    console.log('db connection closed');
  }
})();
