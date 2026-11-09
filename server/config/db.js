const mongoose = require('mongoose')

const ConnectDB = async() => {

    try {
        const Connected = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = ConnectDB;

