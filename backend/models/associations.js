import SystemManager from './SystemManager.model.js';
import Hospital from './hospital.model.js';
import HospitalAdmin from './HospitalAdmin.model.js';
import Donor from './donor.model.js';
import Receiver from './receiver.model.js';
import BloodInventory from './BloodInventory.model.js';
import BloodDonationAppointment from './BloodDonationAppointment.model.js';
import HealthEvaluation from './HealthEvaluation.model.js';
import Feedback from './feedback.model.js';
import Inquiry from './inquiry.model.js';
import BloodRequest from './bloodRequest.model.js';
import Gamification from './gamification.model.js';

// Hospital <-> SystemManager
Hospital.belongsTo(SystemManager, { foreignKey: 'systemManagerId', as: 'systemManager' });
SystemManager.hasMany(Hospital, { foreignKey: 'systemManagerId', as: 'hospitals' });

// HospitalAdmin <-> Hospital
HospitalAdmin.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
Hospital.hasMany(HospitalAdmin, { foreignKey: 'hospitalId', as: 'hospitalAdmins' });

// BloodInventory <-> Hospital
BloodInventory.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
Hospital.hasMany(BloodInventory, { foreignKey: 'hospitalId', as: 'bloodInventory' });

// BloodDonationAppointment <-> Donor / Hospital / HospitalAdmin
BloodDonationAppointment.belongsTo(Donor, { foreignKey: 'donorId', as: 'donor' });
Donor.hasMany(BloodDonationAppointment, { foreignKey: 'donorId', as: 'appointments' });
BloodDonationAppointment.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
Hospital.hasMany(BloodDonationAppointment, { foreignKey: 'hospitalId', as: 'appointments' });
BloodDonationAppointment.belongsTo(HospitalAdmin, { foreignKey: 'hospitalAdminId', as: 'hospitalAdmin' });

// HealthEvaluation <-> Donor / Hospital / HospitalAdmin
HealthEvaluation.belongsTo(Donor, { foreignKey: 'donorId', as: 'donor' });
Donor.hasMany(HealthEvaluation, { foreignKey: 'donorId', as: 'healthEvaluations' });
HealthEvaluation.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
Hospital.hasMany(HealthEvaluation, { foreignKey: 'hospitalId', as: 'healthEvaluations' });
HealthEvaluation.belongsTo(HospitalAdmin, { foreignKey: 'hospitalAdminId', as: 'hospitalAdmin' });

// Feedback <-> Donor / SystemManager
Feedback.belongsTo(Donor, { foreignKey: 'donorId', as: 'donor' });
Feedback.belongsTo(SystemManager, { foreignKey: 'systemManagerId', as: 'systemManager' });

// Inquiry <-> SystemManager
Inquiry.belongsTo(SystemManager, { foreignKey: 'systemManagerId', as: 'systemManager' });

// BloodRequest <-> Receiver / Hospital
BloodRequest.belongsTo(Receiver, { foreignKey: 'receiverId', as: 'receiver' });
Receiver.hasMany(BloodRequest, { foreignKey: 'receiverId', as: 'bloodRequests' });
BloodRequest.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
Hospital.hasMany(BloodRequest, { foreignKey: 'hospitalId', as: 'bloodRequests' });

// Gamification <-> Donor
Gamification.belongsTo(Donor, { foreignKey: 'donorId' });
Donor.hasOne(Gamification, { foreignKey: 'donorId' });
