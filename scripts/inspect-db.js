const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

async function inspectDb() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n--- Current Collections & Counts ---');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }
    
    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (err) {
    console.error('Inspection error:', err.message);
  }
}

inspectDb();
