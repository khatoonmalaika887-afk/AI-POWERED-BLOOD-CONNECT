import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import validator from "validator";
import moment from "moment";

const Hospital = sequelize.define('Hospital', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    systemManagerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'system_managers',
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    identificationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    address: {
        type: DataTypes.TEXT,
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
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            isTime(value) {
                if (!moment(value, "HH:mm", true).isValid()) {
                    throw new Error("Invalid start time format (HH:mm required)");
                }
            },
        },
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            isTime(value) {
                if (!moment(value, "HH:mm", true).isValid()) {
                    throw new Error("Invalid end time format (HH:mm required)");
                }
            },
        },
    },
    activeStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    approvalStatus: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Approved',
    },
}, {
    timestamps: true,
    tableName: 'hospitals',
});

// Sign-in method
Hospital.signin = async function(email, password) {
    if (!email || !password) {
        throw new Error("All fields are required");
    }
    const hospital = await this.findOne({ where: { email } });
    if (!hospital) {
        throw new Error("Incorrect email");
    }
    const match = password === hospital.password;
    if (!match) {
        throw new Error("Incorrect password");
    }
    return hospital;
};

export default Hospital;
