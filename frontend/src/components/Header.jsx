import React, { useState, useEffect } from 'react';
import { Button, Navbar, TextInput, Dropdown, Avatar, Modal, Label, Select, Spinner } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../assets/logo.svg';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';
import { useHospital } from '../hooks/hospital';
import { useHealthEvaluation } from '../hooks/useHealthEvaluation';
import { useBloodDonationAppointment } from '../hooks/useBloodDonationAppointment';
import { useSecondAuth } from '../hooks/useSecondAuth';
import { useDonor } from '../hooks/donor';

export default function Header() {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const { secondUser } = useSecondAuth();
  const { hospitals, loading: hLoading, fetchHospitals } = useHospital();
  const { createEvaluation, loading: heLoading, findLastUpdatedEvaluationByDonor } = useHealthEvaluation();
  const { createAppointment, loading } = useBloodDonationAppointment();
  const { donors, fetchDonorById } = useDonor();
  
  // State for modals and form data
  const [openEvalModal, setOpenEvalModal] = useState(false);
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);
  const userId = user?.userObj?._id;
  const Donor = user?.role === 'Donor';
  const Hospital = user?.role === 'Hospital';
  const HospitalAdmin = secondUser?.role === 'HospitalAdmin';
  const Manager = user?.role === 'Manager';
  const isLoggedIn = Donor || Hospital || Manager || HospitalAdmin;

  const [evalFormData, setEvalFormData] = useState({
    hospitalId: "",
    evaluationDate: "",
    evaluationTime: "",
    donorId: userId || "",
  });

  const [lastEvaluation, setLastEvaluation] = useState(null);

  const selectedHospital = hospitals?.find(h => h._id === evalFormData.hospitalId) || {};

  const [appointmentFormData, setAppointmentFormData] = useState({
    hospitalId: "",
    appointmentDate: "",
    appointmentTime: "",
    donorId: userId || "",
  });

  const [evalErrors, setEvalErrors] = useState({});
  const [appointmentErrors, setAppointmentErrors] = useState({});

  useEffect(() => {
    fetchHospitals(); 
    if (Donor && userId) {
      try {
        fetchDonorById(userId);
      } catch (error) {
        console.error("Error fetching donor:", error);
        toast.error("Failed to fetch donor details");
      }
    }
    const fetchLastEvaluation = async () => {
      if (userId && Donor && user.userObj?.healthStatus) {
        try {
          const res = await findLastUpdatedEvaluationByDonor(userId);
          setLastEvaluation(res);
        } catch (error) {
          console.error("Error fetching last evaluation", error);
        }
      }
    };

    fetchLastEvaluation();
  }, [fetchHospitals, hLoading, fetchDonorById, userId]);

  const loggedInDonor = donors?.find(d => d._id === userId) || {};

  // Today's date for validation
  const today = new Date().toISOString().split('T')[0];

  // Validate Evaluation Form
  const validateEvalForm = () => {
    const errors = {};
    if (!evalFormData.hospitalId) errors.hospitalId = 'Hospital is required';
    if (!evalFormData.evaluationDate) errors.evaluationDate = 'Date is required';
    else if (evalFormData.evaluationDate < today) errors.evaluationDate = 'Date must be today or in the future';
    if (!evalFormData.evaluationTime) errors.evaluationTime = 'Time is required';
    else if (selectedHospital.startTime && selectedHospital.endTime) {
      if (evalFormData.evaluationTime < selectedHospital.startTime || evalFormData.evaluationTime > selectedHospital.endTime) {
        errors.evaluationTime = `Time must be between ${selectedHospital.startTime} and ${selectedHospital.endTime}`;
      }
    }
    setEvalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Appointment Form
  const validateAppointmentForm = () => {
    const errors = {};
    const selectedApptHospital = hospitals?.find(h => h._id === appointmentFormData.hospitalId) || {};
    if (!appointmentFormData.hospitalId) errors.hospitalId = 'Hospital is required';
    if (!appointmentFormData.appointmentDate) errors.appointmentDate = 'Date is required';
    else if (appointmentFormData.appointmentDate < today) errors.appointmentDate = 'Date must be today or in the future';
    if (!appointmentFormData.appointmentTime) errors.appointmentTime = 'Time is required';
    else if (selectedApptHospital.startTime && selectedApptHospital.endTime) {
      if (appointmentFormData.appointmentTime < selectedApptHospital.startTime || appointmentFormData.appointmentTime > selectedApptHospital.endTime) {
        errors.appointmentTime = `Time must be between ${selectedApptHospital.startTime} and ${selectedApptHospital.endTime}`;
      }
    }
    setAppointmentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field change for evaluation
  const handleEvalChange = (e) => {
    const { id, value } = e.target;
    setEvalFormData((prev) => ({ ...prev, [id]: value }));
    setEvalErrors((prev) => ({ ...prev, [id]: '' }));
  };

  // Handle form field change for appointment
  const handleAppointmentChange = (e) => {
    const { id, value } = e.target;
    setAppointmentFormData((prev) => ({ ...prev, [id]: value }));
    setAppointmentErrors((prev) => ({ ...prev, [id]: '' }));
  };

  // Handle Logout
  const handleClick = () => {
    logout();
  };

  // Handle form submission for evaluation
  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    if (!validateEvalForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const evaluationData = { ...evalFormData, donorId: userId || "" };
    try {
      await createEvaluation(evaluationData);
      setOpenEvalModal(false);
      toast.success('Evaluation scheduled successfully');
    } catch (err) {
      toast.error('Error scheduling evaluation');
    }
  };

  // Handle form submission for appointment
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!validateAppointmentForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const appointmentData = { ...appointmentFormData, donorId: userId || "" };
    try {
      await createAppointment(appointmentData);
      setOpenAppointmentModal(false);
      toast.success('Appointment scheduled successfully');
    } catch (err) {
      toast.error('Error scheduling appointment');
    }
  };

  return (
    <Navbar className='relative z-50 border-b-2 bg-primary'>
      {/* Brand Logo */}
      <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'>
        <div className='flex flex-wrap self-center content-center justify-center gap-1'>
          <img src={Logo} alt="logo" className='w-8' />
          <span>Blood Connect</span>
        </div>
      </Link>

      {/* Right Side: Buttons and User Dropdown */}
      <div className='flex gap-2 md:order-2'>
        {Donor && (
          <>
            {!loggedInDonor.healthStatus && !loggedInDonor.appointmentStatus && (
              <Button
                className="bg-secondary hover:bg-accent text-primary font-bold"
                onClick={() => setOpenEvalModal(true)}
              >
                Evaluation
              </Button>
            )}
            {loggedInDonor?.healthStatus &&
              !loggedInDonor?.appointmentStatus &&
              lastEvaluation?.passStatus === 'Passed' && (
                <Button
                  className='bg-secondary hover:bg-accent text-primary font-bold'
                  onClick={() => setOpenAppointmentModal(true)}
                >
                  Appointment
                </Button>
              )}
          </>
        )}
        {Donor && (
          <Dropdown
            arrowIcon={false}
            inline
            label={<Avatar alt="User" img={user?.userObj?.image ? `http://localhost:3020/${user.userObj.image}` : 'https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg'} rounded />}
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">{user.userObj.lastName + " " + user.userObj.firstName || 'User'}</span>
              <span className="block text-sm text-gray-500 truncate">{user.userObj.email}</span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/dashboard')}>Dashboard</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleClick}>Logout</Dropdown.Item>
          </Dropdown>
        )}
        {Hospital && !HospitalAdmin && (
          <Dropdown
            arrowIcon={false}
            inline
            label={<Avatar alt="User" img={user?.userObj?.image ? `http://localhost:3020/${user.userObj.image}` : 'https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg'} rounded />}
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">{user.userObj.name || 'User'}</span>
              <span className="block text-sm text-gray-500 truncate">{user.userObj.email}</span>
            </Dropdown.Header>
            <Dropdown.Item onClick={handleClick}>Logout</Dropdown.Item>
          </Dropdown>
        )}
        {Hospital && HospitalAdmin && (
          <Dropdown
            arrowIcon={false}
            inline
            label={<Avatar alt="User" img={secondUser?.userObj?.image ? `http://localhost:3020/${secondUser.userObj.image}` : 'https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg'} rounded />}
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">{secondUser.userObj.firstName + " " + secondUser.userObj.lastName || 'User'}</span>
              <span className="block text-sm text-gray-500 truncate">{secondUser.userObj.email}</span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => navigate('/profile')}>Hospital Profile</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/adminProfile')}>Admin Profile</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/dashboard')}>Dashboard</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleClick}>Logout</Dropdown.Item>
          </Dropdown>
        )}
        {Manager && (
          <Dropdown
            arrowIcon={false}
            inline
            label={<Avatar alt="User" img={user?.userObj?.image ? `http://localhost:3020/${user.userObj.image}` : 'https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg'} rounded />}
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">{user.userObj.lastName + " " + user.userObj.firstName || 'User'}</span>
              <span className="block text-sm text-gray-500 truncate">{user.userObj.email}</span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/dashboard')}>Dashboard</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleClick}>Logout</Dropdown.Item>
          </Dropdown>
        )}
      </div>

      {/* Navbar Links */}
      <Navbar.Collapse>
        {!isLoggedIn && (
          <Dropdown
            inline
            arrowIcon={true}
            label="Login"
            className="min-w-[10rem]"
          >
            <Dropdown.Item onClick={() => navigate('/donor-login')}>Donor Portal</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/receiver-login')}>Receiver Portal</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/hospital-login')}>Hospital Portal</Dropdown.Item>
          </Dropdown>
        )}
        <Navbar.Link active={path === '/EBR'} as={'div'}>
          <Link to='/EBR'>Emergency Blood Request</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/campaigns'} as={'div'}>
          <Link to='/campaigns'>Campaigns</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/chatbot'} as={'div'}>
          <Link to='/chatbot'>Chatbot</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/donate'} as={'div'}>
          <Link to='/donate'>Donate</Link>
        </Navbar.Link>
      </Navbar.Collapse>

      {/* Evaluation Modal */}
      <Modal show={openEvalModal} onClose={() => setOpenEvalModal(false)}>
        <Modal.Header>Schedule Health Evaluation</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEvalSubmit}>
            <div className="mb-4">
              <Label htmlFor="hospitalId" value="Select Hospital" className="text-gray-700 font-medium" />
              <Select
                id="hospitalId"
                required
                value={evalFormData.hospitalId}
                onChange={handleEvalChange}
                color={evalErrors.hospitalId ? 'failure' : 'gray'}
              >
                <option value="" disabled>Select a hospital</option>
                {hospitals && hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>{hospital.name}</option>
                ))}
              </Select>
              {evalErrors.hospitalId && <p className="text-red-600 text-sm mt-1">{evalErrors.hospitalId}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="evaluationDate" value="Evaluation Date" className="text-gray-700 font-medium" />
              <TextInput
                id="evaluationDate"
                type="date"
                required
                min={today}
                value={evalFormData.evaluationDate}
                onChange={handleEvalChange}
                color={evalErrors.evaluationDate ? 'failure' : 'gray'}
              />
              {evalErrors.evaluationDate && <p className="text-red-600 text-sm mt-1">{evalErrors.evaluationDate}</p>}
            </div>
            {selectedHospital?.startTime && selectedHospital?.endTime && (
              <p className="text-sm text-gray-500 mt-1">
                Available between {selectedHospital.startTime} - {selectedHospital.endTime}
              </p>
            )}
            <div className="mb-4">
              <Label htmlFor="evaluationTime" value="Evaluation Time" className="text-gray-700 font-medium" />
              <TextInput
                id="evaluationTime"
                type="time"
                required
                value={evalFormData.evaluationTime}
                onChange={handleEvalChange}
                color={evalErrors.evaluationTime ? 'failure' : 'gray'}
              />
              {evalErrors.evaluationTime && <p className="text-red-600 text-sm mt-1">{evalErrors.evaluationTime}</p>}
            </div>
            <Modal.Footer>
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-accent text-primary font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center"
                disabled={heLoading}
              >
                {heLoading ? <Spinner color="primary" size="sm" /> : "Schedule Evaluation"}
              </Button>
              <Button color="gray" onClick={() => setOpenEvalModal(false)}>Cancel</Button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>

      {/* Appointment Modal */}
      <Modal show={openAppointmentModal} onClose={() => setOpenAppointmentModal(false)}>
        <Modal.Header>Schedule an Appointment</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAppointmentSubmit}>
            <div className="mb-4">
              <Label htmlFor="hospitalId" value="Select Hospital" className="text-gray-700 font-medium" />
              <Select
                id="hospitalId"
                required
                value={appointmentFormData.hospitalId}
                onChange={handleAppointmentChange}
                color={appointmentErrors.hospitalId ? 'failure' : 'gray'}
              >
                <option value="" disabled>Select a hospital</option>
                {hospitals && hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>{hospital.name}</option>
                ))}
              </Select>
              {appointmentErrors.hospitalId && <p className="text-red-600 text-sm mt-1">{appointmentErrors.hospitalId}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="appointmentDate" value="Appointment Date" className="text-gray-700 font-medium" />
              <TextInput
                id="appointmentDate"
                type="date"
                required
                min={today}
                value={appointmentFormData.appointmentDate}
                onChange={handleAppointmentChange}
                color={appointmentErrors.appointmentDate ? 'failure' : 'gray'}
              />
              {appointmentErrors.appointmentDate && <p className="text-red-600 text-sm mt-1">{appointmentErrors.appointmentDate}</p>}
              {appointmentFormData.hospitalId && hospitals.find(h => h._id === appointmentFormData.hospitalId)?.startTime && (
                <p className="text-sm text-gray-500 mt-1">
                  Available between {hospitals.find(h => h._id === appointmentFormData.hospitalId).startTime} - {hospitals.find(h => h._id === appointmentFormData.hospitalId).endTime}
                </p>
              )}
            </div>
            <div className="mb-4">
              <Label htmlFor="appointmentTime" value="Appointment Time" className="text-gray-700 font-medium" />
              <TextInput
                id="appointmentTime"
                type="time"
                required
                value={appointmentFormData.appointmentTime}
                onChange={handleAppointmentChange}
                color={appointmentErrors.appointmentTime ? 'failure' : 'gray'}
              />
              {appointmentErrors.appointmentTime && <p className="text-red-600 text-sm mt-1">{appointmentErrors.appointmentTime}</p>}
            </div>
            <Modal.Footer>
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-accent text-primary font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center"
                disabled={loading}
              >
                {loading ? <Spinner color="primary" size="sm" /> : "Schedule Appointment"}
              </Button>
              <Button color="gray" onClick={() => setOpenAppointmentModal(false)}>Cancel</Button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>
    </Navbar>
  );
}