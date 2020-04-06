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
          // knifeEnabled: '$knifeEnabled',
        },
        knifeEnabled: { $avg: '$knifeEnabled' },
      } },
      { $sort: { 'knifeEnabled': 1 } },
      {
        $replaceRoot: {
          newRoot: {
            name: { $concat: ['$_id.region', ' - ', '$_id.financialYear'] },
            averageKnifeEnabled: '$knifeEnabled',
          },
        },
      },
      // { $group: {
      //   _id: '$_id.region',
      //   years: { $addToSet: {
      //     name: '$_id.financialYear',
      //     knifeEnabled: { $sum: '$_id.knifeEnabled' },
      //   } },
      //   // year: { $sum: '$_id.knifeEnabled' },
      // } },
      // { $sort: { '_id.financialYear': 1 } },
      // { $group: {
      //   _id: '$_id.region',
      //   years: { $push: {
      //     year: '$_id.financialYear',
      //     knifeEnabled: '$_id.knifeEnabled',
      //   } },
      // } },
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

    // console.log('forceNames: %o', forceNames);
    // console.log('clevelandGroup: %o', clevelandGroup);
    console.log('regionOverview: %o', regionOverview);
    // console.log('records: %o', records);
  } catch ({ stack }) {
    console.error(stack);
  } finally {
    client.close();
    console.log('db connection closed');
  }
})();
