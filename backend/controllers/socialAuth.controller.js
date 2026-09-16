import Donor from '../models/donor.model.js';
import Hospital from '../models/hospital.model.js';
import SystemManager from '../models/SystemManager.model.js';
import HospitalAdmin from '../models/HospitalAdmin.model.js';
import Receiver from '../models/receiver.model.js';
import createToken from '../utils/token.js';
import axios from 'axios';

// Helper function to verify Google token
const verifyGoogleToken = async (token) => {
  try {
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
};

// Helper function to verify Facebook token
const verifyFacebookToken = async (token, userId) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${userId}?fields=id,name,email&access_token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying Facebook token:', error);
    throw new Error('Invalid Facebook token');
  }
};

// Donor social login
// NOTE: Donor requires gender/nic/city (and a unique phoneNumber) that OAuth
// providers don't supply, so auto-creating a new donor here will still fail
// SequelizeValidationError until the app collects those via a follow-up profile step.
export const donorSocialLogin = async (req, res) => {
  const { provider, token, userId } = req.body;

  try {
    let userData;

    if (provider === 'google') {
      userData = await verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      userData = await verifyFacebookToken(token, userId);
    } else {
      return res.status(400).json({ message: 'Unsupported social login provider' });
    }

    // Check if user exists
    let user = await Donor.findOne({ where: { email: userData.email } });

    // If user doesn't exist, create a new one
    if (!user) {
      const [firstName, ...rest] = (userData.name || 'Donor').split(' ');
      user = await Donor.create({
        email: userData.email,
        firstName: firstName || 'Donor',
        lastName: rest.join(' ') || 'User',
        password: Math.random().toString(36).slice(-10), // Generate random password
        activeStatus: true,
        // Placeholders for fields OAuth doesn't provide - not a real solution, see NOTE above
        phoneNumber: '0000000000',
        dob: new Date('2000-01-01'),
        bloodType: 'A+',
        gender: 'Other',
        city: 'Unknown',
        nic: '000000000000',
      });
    }

    const role = 'Donor';
    const jwt = createToken(user.id);
    const userObj = user.toJSON();
    delete userObj.password;
    userObj._id = userObj.id;

    res.status(200).json({ token: jwt, userObj, role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hospital social login
export const hospitalSocialLogin = async (req, res) => {
  const { provider, token, userId } = req.body;

  try {
    let userData;

    if (provider === 'google') {
      userData = await verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      userData = await verifyFacebookToken(token, userId);
    } else {
      return res.status(400).json({ message: 'Unsupported social login provider' });
    }

    // Check if hospital exists
    let hospital = await Hospital.findOne({ where: { email: userData.email } });

    if (!hospital) {
      return res.status(403).json({ message: 'No hospital account found with this email' });
    }

    const role = 'Hospital';
    const jwt = createToken(hospital.id);
    const userObj = hospital.toJSON();
    delete userObj.password;
    userObj._id = userObj.id;

    res.status(200).json({ token: jwt, userObj, role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin social login
export const adminSocialLogin = async (req, res) => {
  const { provider, token, userId } = req.body;

  try {
    let userData;

    if (provider === 'google') {
      userData = await verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      userData = await verifyFacebookToken(token, userId);
    } else {
      return res.status(400).json({ message: 'Unsupported social login provider' });
    }

    // For security reasons, we'll only allow existing admins to login with social
    const admin = await SystemManager.findOne({ where: { email: userData.email } });

    if (!admin) {
      return res.status(403).json({ message: 'No admin account found with this email' });
    }

    const role = 'Manager';
    const jwt = createToken(admin.id);
    const userObj = admin.toJSON();
    delete userObj.password;
    userObj._id = userObj.id;

    res.status(200).json({ token: jwt, userObj, role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hospital Admin social login
export const hospitalAdminSocialLogin = async (req, res) => {
  const { provider, token, userId } = req.body;

  try {
    let userData;

    if (provider === 'google') {
      userData = await verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      userData = await verifyFacebookToken(token, userId);
    } else {
      return res.status(400).json({ message: 'Unsupported social login provider' });
    }

    // Check if hospital admin exists
    let admin = await HospitalAdmin.findOne({ where: { email: userData.email } });

    if (!admin) {
      return res.status(403).json({ message: 'No hospital admin account found with this email' });
    }

    const role = 'HospitalAdmin';
    const jwt = createToken(admin.id);
    const userObj = admin.toJSON();
    delete userObj.password;
    userObj._id = userObj.id;

    res.status(200).json({ token: jwt, userObj, role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Receiver social login
// NOTE: Receiver requires gender/nic/city (and a unique phoneNumber) that OAuth
// providers don't supply, so auto-creating a new receiver here will still fail
// SequelizeValidationError until the app collects those via a follow-up profile step.
export const receiverSocialLogin = async (req, res) => {
  const { provider, token, userId } = req.body;

  try {
    let userData;

    if (provider === 'google') {
      userData = await verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      userData = await verifyFacebookToken(token, userId);
    } else {
      return res.status(400).json({ message: 'Unsupported social login provider' });
    }

    // Check if receiver exists in the database
    let receiver = await Receiver.findOne({ where: { email: userData.email } });

    // If receiver doesn't exist, create a new one
    if (!receiver) {
      const [firstName, ...rest] = (userData.name || 'Receiver').split(' ');
      receiver = await Receiver.create({
        email: userData.email,
        firstName: firstName || 'Receiver',
        lastName: rest.join(' ') || 'User',
        password: Math.random().toString(36).slice(-10), // Generate random password
        activeStatus: true,
        // Placeholders for fields OAuth doesn't provide - not a real solution, see NOTE above
        phoneNumber: '0000000000',
        dob: new Date('2000-01-01'),
        bloodType: 'A+',
        gender: 'Other',
        city: 'Unknown',
        nic: '000000000000',
      });
    }

    const jwt = createToken(receiver.id);
    const receiverObj = receiver.toJSON();
    delete receiverObj.password;
    receiverObj._id = receiverObj.id;

    res.status(200).json({
      token: jwt,
      receiver: {
        ...receiverObj,
        role: 'Receiver'
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
