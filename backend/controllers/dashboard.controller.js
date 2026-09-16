import { Op } from 'sequelize';
import Donor from '../models/donor.model.js';
import Hospital from '../models/hospital.model.js';
import BloodDonationAppointment from '../models/BloodDonationAppointment.model.js';
import BloodInventory from '../models/BloodInventory.model.js';
import EmergencyBR from '../models/EmergencyBR.model.js';
import HospitalAdmin from '../models/HospitalAdmin.model.js';
import Inquiry from '../models/inquiry.model.js';
import Receiver from '../models/receiver.model.js';

export const getDonorData = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const donor = await Donor.findByPk(userId, { attributes: ['bloodType', 'healthStatus'] });
    const appointments = await BloodDonationAppointment.findAll({
      where: {
        donorId: userId,
        progressStatus: { [Op.ne]: 'Cancelled' },
      },
      order: [['appointmentDate', 'DESC']],
    });

    const totalDonations = await BloodDonationAppointment.count({
      where: { donorId: userId, progressStatus: 'Completed' },
    });

    const nextAppointment = appointments.find(
      (appt) => new Date(appt.appointmentDate) >= new Date()
    );

    res.json({
      bloodType: donor?.bloodType || 'N/A',
      healthStatus: donor?.healthStatus || false,
      totalDonations,
      nextAppointment: nextAppointment
        ? { date: nextAppointment.appointmentDate, time: nextAppointment.appointmentTime }
        : null,
      donationHistory: appointments.map((appt) => ({
        date: appt.appointmentDate,
        hospitalId: appt.hospitalId,
        status: appt.progressStatus,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHospitalData = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const hospital = await Hospital.findByPk(userId, { attributes: ['name'] });
    const bloodStock = await BloodInventory.findAll({
      where: { hospitalId: userId, expiredStatus: { [Op.ne]: 'Expired' } },
    });
    const totalStock = bloodStock.reduce((sum, stock) => sum + stock.availableStocks, 0);
    const activeDonors = await BloodDonationAppointment.count({
      where: {
        hospitalId: userId,
        progressStatus: 'Completed',
        appointmentDate: { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      distinct: true,
      col: 'donorId',
    });
    const pendingRequests = await EmergencyBR.count({
      where: { hospitalName: hospital?.name || '', acceptStatus: 'Pending' },
    });

    res.json({
      totalStock,
      activeDonors,
      pendingRequests,
      bloodStock: bloodStock.map((stock) => ({
        bloodType: stock.bloodType,
        units: stock.availableStocks,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getManagerData = async (req, res) => {
  try {
    const totalUsers = (await Donor.count()) +
                       (await Hospital.count()) +
                       (await HospitalAdmin.count());
    const hospitals = await Hospital.count();
    const inactiveAccounts = (await Donor.count({ where: { activeStatus: false } })) +
                             (await Hospital.count({ where: { activeStatus: false } })) +
                             (await HospitalAdmin.count({ where: { activeStatus: false } }));
    const pendingInquiries = await Inquiry.count({ where: { attentiveStatus: 'Pending' } });

    res.json({
      totalUsers,
      hospitals,
      inactiveAccounts,
      pendingInquiries,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGeneralData = async (req, res) => {
  try {
    const totalDonors = await Donor.count();
    const totalReceivers = await Receiver.count();
    const totalHospitals = await Hospital.count();
    const totalDonations = await BloodDonationAppointment.count({
      where: { progressStatus: 'Completed' },
    });
    const totalRequests = await EmergencyBR.count();
    const emergencyRequests = await EmergencyBR.count({
      where: { acceptStatus: 'Pending' },
    });

    res.json({
      totalDonors,
      totalReceivers,
      totalHospitals,
      totalDonations,
      totalRequests,
      emergencyRequests,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
