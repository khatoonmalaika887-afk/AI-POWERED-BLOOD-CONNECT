import Donor from '../models/donor.model.js';
import createToken from '../utils/token.js';
import Hospital from '../models/hospital.model.js';
import SystemManager from '../models/SystemManager.model.js';
import HospitalAdmin from '../models/HospitalAdmin.model.js';

export const signinHD = async (req, res) => {
    const { email, password, userId } = req.body;

    if (!email || !password || email === '' || password === '') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const user = await HospitalAdmin.signin(email, password, userId);
        if (!user.activeStatus) {
            return res.status(403).json({ message: 'Your account has been deactivated' });
        }
        const role = 'HospitalAdmin';

        const token = createToken(user.id);
        const userObj = user.toJSON();
        delete userObj.password;
        userObj._id = userObj.id; // frontend still reads the Mongoose-style _id field

        res.status(200).json({ token, userObj, role });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const signinD = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || email === '' || password === '') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const user = await Donor.signin(email, password);
        if (!user.activeStatus) {
            return res.status(403).json({ message: 'Your account has been deactivated' });
        }
        const role = 'Donor';

        const token = createToken(user.id);
        const userObj = user.toJSON();
        delete userObj.password;
        userObj._id = userObj.id; // frontend still reads the Mongoose-style _id field

        res.status(200).json({ token, userObj, role });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const signinH = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || email === '' || password === '') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const user = await Hospital.signin(email, password);
        if (user.approvalStatus === 'Pending') {
            return res.status(403).json({ message: 'Your registration is still awaiting admin review. Please check back soon.' });
        }
        if (user.approvalStatus === 'Rejected') {
            return res.status(403).json({ message: 'Your registration was not approved. Please contact support for details.' });
        }
        if (!user.activeStatus) {
            return res.status(403).json({ message: 'Your account has been deactivated' });
        }
        const role = 'Hospital';

        const token = createToken(user.id);
        const userObj = user.toJSON();
        delete userObj.password;
        userObj._id = userObj.id; // frontend still reads the Mongoose-style _id field

        res.status(200).json({ token, userObj, role });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const signinA = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || email === '' || password === '') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const user = await SystemManager.signin(email, password);
        if (!user.activeStatus) {
            return res.status(403).json({ message: 'Your account has been deactivated' });
        }
        const role = 'Manager';

        const token = createToken(user.id);
        const userObj = user.toJSON();
        delete userObj.password;
        userObj._id = userObj.id; // frontend still reads the Mongoose-style _id field

        res.status(200).json({ token, userObj, role });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
