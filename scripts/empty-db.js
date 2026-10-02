const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Owner = require('../src/models/Owner');
const Transaction = require('../src/models/Transaction');
const Ticket = require('../src/models/Ticket');
const Service = require('../src/models/Service');
const UsedItem = require('../src/models/UsedItem');
const Visit = require('../src/models/Visit');
const Roommate = require('../src/models/Roommate');
const Conversation = require('../src/models/Conversation');
const Notification = require('../src/models/Notification');
const ActivityLog = require('../src/models/ActivityLog');

async function emptyDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB!');

    console.log('\n🧹 Purging collections...');
    await Property.deleteMany({});
    console.log('✔ Properties purged: 0 remaining');

    await Owner.deleteMany({});
    console.log('✔ Owners purged: 0 remaining');

    await Roommate.deleteMany({});
    console.log('✔ Roommates purged: 0 remaining');

    await UsedItem.deleteMany({});
    console.log('✔ Used Items purged: 0 remaining');

    await Visit.deleteMany({});
    console.log('✔ Visits purged: 0 remaining');

    await Transaction.deleteMany({});
    console.log('✔ Transactions purged: 0 remaining');

    await Ticket.deleteMany({});
    console.log('✔ Tickets purged: 0 remaining');

    await Service.deleteMany({});
    console.log('✔ Services purged: 0 remaining');

    await Conversation.deleteMany({});
    console.log('✔ Conversations purged: 0 remaining');

    await Notification.deleteMany({});
    console.log('✔ Notifications purged: 0 remaining');

    await ActivityLog.deleteMany({});
    console.log('✔ ActivityLogs purged: 0 remaining');

    // Remove all users except master admin
    await User.deleteMany({});
    console.log('✔ All previous test users purged.');

    // Create fresh clean master admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      customId: 'usr-admin-master',
      name: 'Super Admin',
      email: 'admin@propertyhub.in',
      mobile: '+91 99999 99999',
      password: hashedPassword,
      role: 'Super Admin',
      city: 'Lucknow',
      locality: 'Hazratganj',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    });
    console.log('✔ Clean Super Admin created (admin@propertyhub.in / admin123).');

    console.log('\n--- Final Database Status ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    await mongoose.disconnect();
    console.log('\nDatabase completely emptied and reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error emptying database:', err);
    process.exit(1);
  }
}

emptyDatabase();
