import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const BloodDonationAppointment = sequelize.define('BloodDonationAppointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    donorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'donors',
            key: 'id',
        },
    },
    hospitalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'hospitals',
            key: 'id',
        },
    },
    hospitalAdminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'hospital_admins',
            key: 'id',
        },
    },
    feedbackStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    receiptNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    progressStatus: {
        type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Cancelled'),
        defaultValue: 'Not Started',
    },
    activeStatus: {
        type: DataTypes.ENUM('Scheduled', 'Re-Scheduled', 'Accepted', 'Cancelled'),
        defaultValue: 'Scheduled',
    },
}, {
    timestamps: true,
    tableName: 'blood_donation_appointments',
});

// Static methods
BloodDonationAppointment.cancelExpiredAppointments = async function () {
    const currentDateTime = new Date();
    const { Op } = sequelize.Sequelize;

    const appointments = await this.findAll({
        where: {
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('CONCAT', sequelize.col('appointmentDate'), ' ', sequelize.col('appointmentTime')),
                    '<',
                    currentDateTime.toISOString().slice(0, 19).replace('T', ' ')
                ),
                // Don't clobber appointments that already reached a final state
                { progressStatus: { [Op.notIn]: ['Completed', 'Cancelled'] } },
            ],
        },
    });

    for (const appointment of appointments) {
        await appointment.update({
            progressStatus: 'Cancelled',
            activeStatus: 'Cancelled'
        });
    }
};

BloodDonationAppointment.updateAppointmentStatusAfter56Days = async function () {
    const currentDate = new Date();
    const fiftySixDaysAgo = new Date(currentDate);
    fiftySixDaysAgo.setDate(currentDate.getDate() - 56);

    // Get all donor IDs with appointments
    const donorsWithAppointments = await this.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('donorId')), 'donorId']],
        raw: true
    });

    for (const { donorId } of donorsWithAppointments) {
        try {
            // Find the most recent appointment for the donor
            const latestAppointment = await this.findOne({
                where: { donorId },
                order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
            });

            if (!latestAppointment) continue;

            // Combine appointment date and time
            const appointmentDateTime = new Date(`${latestAppointment.appointmentDate}T${latestAppointment.appointmentTime}`);

            // Check if the latest appointment is older than 56 days
            if (appointmentDateTime < fiftySixDaysAgo) {
                // Update appointmentStatus to false for the donor in related models
                // Note: This might need adjustment based on your actual schema
                // For now, we'll assume appointmentStatus is in the donor model
                const Donor = (await import('./donor.model.js')).default;
                await Donor.update(
                    { appointmentStatus: false },
                    { where: { id: donorId, appointmentStatus: true } }
                );
            }
        } catch (error) {
            // Silent error handling
        }
    }
};

export default BloodDonationAppointment;
