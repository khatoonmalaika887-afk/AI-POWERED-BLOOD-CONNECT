import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import validator from "validator";
import moment from "moment";
import bcrypt from "bcryptjs";

const Donor = sequelize.define('Donor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
            is: /^\d{10}$/,
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 100], // Minimum 8 characters
        },
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true,
            isAdult(value) {
                if (moment().diff(moment(value), 'years') < 18) {
                    throw new Error('Donor must be at least 18 years old!');
                }
            },
        },
    },
    bloodType: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nic: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: true,
        validate: {
            is: /^\d{12}$/,
        },
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    activeStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    healthStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    appointmentStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    donationHistory: {
        type: DataTypes.JSON, // Array of donation records
        defaultValue: [],
    },
    totalDonations: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lastDonationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    emergencyNotificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    tableName: 'donors',
});

// Signin method
Donor.signin = async function(email, password) {
    if (!email || !password) {
        throw new Error("All Fields are Required");
    }
    const donor = await this.findOne({ where: { email } });
    if (!donor) {
        throw new Error("Incorrect Email");
    }
    const match = await bcrypt.compare(password, donor.password);
    if (!match) {
        throw new Error("Incorrect Password");
    }
    return donor;
};

export default Donor;
