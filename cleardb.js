const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';

const dbName = 'chatApp';
const collectionName = 'onlineUsers';

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function clearCollection() {
  try {
    await client.connect();

    const database = client.db(dbName);

    const collection = database.collection(collectionName);

    const result = await collection.deleteMany({});

    console.log(`${result.deletedCount} document(s) deleted from the collection.`);
  } finally {
    await client.close();
  }
}
clearCollection();