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

    const forceNames = await byQuarterCollection
      .aggregate([{ $group: { _id: 0, names: { $addToSet: '$forceName' } } }])
      .toArray();

    const regionOverview = await byQuarterCollection.aggregate([
      { $group: {
        _id: {
          region: '$Region',
          financialYear: '$financialYear',
        },
        knifeEnabledYearTotal: { $sum: '$knifeEnabled' },
        knifeEnabledQuarterlyAverage: { $avg: '$knifeEnabled' },
      } },
      { $sort: { '_id.financialYear': 1 } },
      { $group: {
        _id: '$_id.region',
        years: { $push: {
          year: '$_id.financialYear',
          knifeEnabledYearTotal: '$knifeEnabledYearTotal',
          knifeEnabledQuarterlyAverage: '$knifeEnabledQuarterlyAverage',
        } },
        regionTotal: { $sum: '$knifeEnabledYearTotal' },
      }},
      { $project: {
        _id: 0,
        name: '$_id',
        years: 1,
        regionTotal: 1,
      } },
      { $sort: { regionTotal: 1 } },
    ]).toArray();

    const clevelandGroup = await byQuarterCollection
      .aggregate([
        { $match: { forceName: 'Cleveland' } },
        { $sort: { financialQuarter: 1 } },
        {
          $group: {
            _id: '$financialYear',
            quarters: {
              $push: {
                _id: '$$ROOT.financialQuarter',
                knifeEnabled: '$$ROOT.knifeEnabled',
              },
            },
            totalYearKnifeEnabled: { $sum: '$$ROOT.knifeEnabled' },
          },
        },
        { $addFields: { quarterlyKnifeEnabledAvg: { $avg: '$quarters.knifeEnabled' } } },
        { $sort: { _id: -1 } },
      ])
      .toArray();

    // writeToFile(regionOverview, `data/exports/regionOverview.json`);

    // console.log('forceNames: %o', forceNames);
    // console.log('clevelandGroup: %o', clevelandGroup);
    // console.log('regionOverview: %o', regionOverview);
    console.log('records: %o', records);
  } catch ({ stack }) {
    console.error(stack);
  } finally {
    client.close();
    console.log('db connection closed');
  }
})();
