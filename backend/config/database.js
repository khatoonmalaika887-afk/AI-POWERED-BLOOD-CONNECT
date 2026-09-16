import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  (process.env.DB_NAME ?? 'blood_donation1_db').replace(/,$/, ''),
  process.env.DB_USER ?? 'root',
  process.env.DB_PASSWORD ?? 'shariqsherri',
  {
    host: process.env.DB_HOST ?? '127.0.0.1',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database');
    // Sync all models (create tables if they don't exist)
    await sequelize.sync(); // Using default sync without altering tables to avoid key limit issues
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
