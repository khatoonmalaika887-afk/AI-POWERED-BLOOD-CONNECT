import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const HealthEvaluation = sequelize.define('HealthEvaluation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    receiptNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
    },
    passStatus: {
        type: DataTypes.ENUM('Pending', 'Passed', 'Failed', 'Cancelled'),
        defaultValue: 'Pending',
    },
    progressStatus: {
        type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Cancelled'),
        defaultValue: 'Not Started',
    },
    feedbackStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    activeStatus: {
        type: DataTypes.ENUM('Scheduled', 'Re-Scheduled', 'Accepted', 'Cancelled'),
        defaultValue: 'Scheduled',
    },
    hospitalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'hospitals',
            key: 'id',
        },
    },
    donorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'donors',
            key: 'id',
        },
    },
    evaluationFile: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    hospitalAdminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'hospital_admins',
            key: 'id',
        },
    },
    evaluationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    evaluationTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'health_evaluations',
});

// Static methods
HealthEvaluation.cancelExpiredEvaluations = async function () {
    const currentDateTime = new Date();
    const { Op } = sequelize.Sequelize;

    const evaluations = await this.findAll({
        where: {
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('CONCAT', sequelize.col('evaluationDate'), ' ', sequelize.col('evaluationTime')),
                    '<=',
                    currentDateTime.toISOString().slice(0, 19).replace('T', ' ')
                ),
                // Don't clobber evaluations that already reached a final state
                { progressStatus: { [Op.notIn]: ['Completed', 'Cancelled'] } },
            ],
        },
    });

    for (const evaluation of evaluations) {
        await evaluation.update({
            passStatus: 'Cancelled',
            progressStatus: 'Cancelled',
            activeStatus: 'Cancelled'
        });

        try {
            // Update the donor's health status
            const Donor = (await import('./donor.model.js')).default;
            await Donor.update(
                { healthStatus: false },
                { where: { id: evaluation.donorId } }
            );
        } catch (error) {
            console.error(`Failed to update healthStatus for donor ${evaluation.donorId}:`, error.message);
        }
    }
};

HealthEvaluation.updateHealthStatusAfter56Days = async function () {
    const currentDate = new Date();
    const fiftySixDaysAgo = new Date(currentDate);
    fiftySixDaysAgo.setDate(currentDate.getDate() - 56);

    // Get all donor IDs with evaluations
    const donorsWithEvaluations = await this.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('donorId')), 'donorId']],
        raw: true
    });

    for (const { donorId } of donorsWithEvaluations) {
        try {
            // Find the most recent evaluation for the donor
            const latestEvaluation = await this.findOne({
                where: { donorId },
                order: [['evaluationDate', 'DESC'], ['evaluationTime', 'DESC']]
            });

            if (!latestEvaluation) continue;

            // Combine evaluation date and time
            const evalDateTime = new Date(`${latestEvaluation.evaluationDate}T${latestEvaluation.evaluationTime}`);

            // Check if the latest evaluation is older than 56 days
            if (evalDateTime < fiftySixDaysAgo) {
                // Update the healthStatus to false
                const Donor = (await import('./donor.model.js')).default;
                await Donor.update(
                    { healthStatus: false },
                    { where: { id: donorId, healthStatus: true } }
                );
            }
        } catch (error) {
            // Silent error handling
        }
    }
};

export default HealthEvaluation;
