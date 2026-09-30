const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Property = require('../models/Property');
const Owner = require('../models/Owner');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const { 
  initialProperties, 
  initialOwners, 
  initialUsers, 
  initialTransactions, 
  initialTickets 
} = require('./mockSource');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/property_hub_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ [Connected to MongoDB]: ${conn.connection.host}`);

    // Clear existing records
    await Property.deleteMany({});
    await Owner.deleteMany({});
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Ticket.deleteMany({});
    console.log('🧹 Purged existing collections.');

    // Insert seeds
    const createdProperties = await Property.insertMany(initialProperties);
    const createdOwners = await Owner.insertMany(initialOwners);
    const createdUsers = await User.insertMany(initialUsers);
    const createdTxns = await Transaction.insertMany(initialTransactions);
    const createdTickets = await Ticket.insertMany(initialTickets);

    console.log(`\n🎉 Seed data successfully inserted into MongoDB!`);
    console.log(`   - Properties: ${createdProperties.length}`);
    console.log(`   - Owners:     ${createdOwners.length}`);
    console.log(`   - Users:      ${createdUsers.length}`);
    console.log(`   - Financials: ${createdTxns.length}`);
    console.log(`   - Tickets:    ${createdTickets.length}`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeder Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
