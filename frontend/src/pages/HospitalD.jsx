import React, { useEffect, useState } from "react";
import { Button, Spinner, Table, Modal, TextInput, Label, FileInput, Select } from "flowbite-react";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { useHospital } from "../hooks/hospital";
import { useHospitalAdmin } from "../hooks/useHospitalAdmin";
import { useAuthContext } from "../hooks/useAuthContext";
import { toast } from "react-toastify";
import { useGenerateReport } from "../hooks/useGenerateReport";

export default function HospitalDashboard() {
  const { hospitals, loading, error, fetchHospitals, deleteHospital, updateHospital, createHospital, updateHospitalApproval } = useHospital();
  const { createHospitalAdmin } = useHospitalAdmin();
  const [editHospital, setEditHospital] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const { user } = useAuthContext();
  const userId = user?.userObj?._id;
  const Manager = user?.role === 'Manager';
  const [newHospital, setNewHospital] = useState({
    name: "",
    city: "",
    identificationNumber: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    image: null,
    startTime: "",
    endTime: "",
    activeStatus: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [addAdminErrors, setAddAdminErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const { reportUrl, generateHospitalReport } = useGenerateReport();
  const [filter, setFilter] = useState({
    name: "",
    city: "",
    status: ""
  });
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [adminData, setAdminData] = useState({
    hospitalId: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dob: "",
    address: "",
    nic: "",
    image: null,
    password: "",
  });

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    const filtered = hospitals.filter(hospital => {
      const nameMatch = filter.name ? hospital.name.toLowerCase().includes(filter.name.toLowerCase()) : true;
      const cityMatch = filter.city ? hospital.city?.toLowerCase().includes(filter.city.toLowerCase()) : true;
      const statusMatch = filter.status ? 
        (filter.status === "active" ? hospital.activeStatus : !hospital.activeStatus) : true;

      return nameMatch && cityMatch && statusMatch;
    });
    setFilteredHospitals(filtered);
  }, [hospitals, filter]);

  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    setFilter(prev => ({ ...prev, [id]: value }));
  };

  const validateAddForm = (data) => {
    const errors = {};
    if (!data.name) errors.name = "Name is required";
    if (!data.city) errors.city = "City is required";
    if (!data.identificationNumber) {
      errors.identificationNumber = "Identification number is required";
    } else if (!/^HOSP[A-Za-z0-9-]+$/.test(data.identificationNumber)) {
      errors.identificationNumber = "ID must start with 'HOSP' followed by letters/numbers/hyphens";
    }
    if (!data.email) errors.email = "Email is required";
    else if (!/^[^\s@]+@health\.gov\.lk$/.test(data.email)) errors.email = "Email must end with @health.gov.lk";
    if (!data.password) errors.password = "Password is required";
    else if (data.password.length < 6) errors.password = "Password must be at least 6 characters";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) errors.password = "Password must contain at least one special character";
    if (!data.phoneNumber) errors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(data.phoneNumber)) errors.phoneNumber = "Must be exactly 10 digits";
    if (!data.address) errors.address = "Address is required";
    if (!data.image) errors.image = "Image is required";
    else if (!["image/jpeg", "image/png"].includes(data.image.type)) errors.image = "Only JPG/PNG allowed";
    if (!data.startTime) errors.startTime = "Start time is required";
    if (!data.endTime) errors.endTime = "End time is required";
    else if (data.startTime >= data.endTime) errors.endTime = "Must be after start time";
    return errors;
  };

  const validateAdminForm = (data) => {
    const errors = {};
    if (!data.hospitalId) errors.hospitalId = "Hospital is required";
    if (!data.email) errors.email = "Email is required";
    else if (!/^[^\s@]+@health\.gov\.lk$/.test(data.email))
      errors.email = "Email must end with @health.gov.lk";
    if (!data.firstName) errors.firstName = "First name is required";
    if (!data.lastName) errors.lastName = "Last name is required";
    if (!data.phoneNumber) errors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(data.phoneNumber))
      errors.phoneNumber = "Phone number must be exactly 10 digits";
    if (!data.dob) errors.dob = "Date of birth is required";
    else {
      const dobDate = new Date(data.dob);
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 20,
        today.getMonth(),
        today.getDate()
      );
      if (dobDate >= minAgeDate) errors.dob = "Must be at least 20 years old";
    }
    if (!data.address) errors.address = "Address is required";
    if (!data.nic) errors.nic = "NIC is required";
    else if (!/^\d{12}$/.test(data.nic))
      errors.nic = "NIC must be exactly 12 digits";
    if (!data.password) errors.password = "Password is required";
    else if (
      data.password.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(data.password)
    ) {
      errors.password =
        "Password must be at least 6 characters and contain at least one special character";
    }
    if (data.image && !["image/jpeg", "image/png"].includes(data.image.type))
      errors.image = "Image must be JPG or PNG";
    return errors;
  };

  const validateEditForm = (data) => {
    const errors = {};
    if (!data.city) errors.city = "City is required";
    if (!data.phoneNumber) errors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(data.phoneNumber)) errors.phoneNumber = "Must be exactly 10 digits";
    if (!data.address) errors.address = "Address is required";
    if (!data.startTime) errors.startTime = "Start time is required";
    if (!data.endTime) errors.endTime = "End time is required";
    else if (data.startTime >= data.endTime) errors.endTime = "Must be after start time";
    return errors;
  };

  const handlePhoneNumberChange = (e, isEdit = false) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) {
      if (isEdit) {
        setEditHospital(prev => ({ ...prev, phoneNumber: value }));
      } else {
        setNewHospital(prev => ({ ...prev, phoneNumber: value }));
      }
    }
  };

  const handleIdentificationNumberChange = (e, isEdit = false) => {
    const value = e.target.value;
    if (isEdit) {
      setEditHospital(prev => ({ ...prev, identificationNumber: value }));
    } else {
      setNewHospital(prev => ({ ...prev, identificationNumber: value }));
    }
  };

  const handleAdminChange = (e) => {
    const { id, value } = e.target;
    let sanitizedValue = value;
    if (id === "phoneNumber" || id === "nic") {
      sanitizedValue = value.replace(/[^0-9]/g, "");
    }
    setAdminData((prev) => ({ ...prev, [id]: sanitizedValue }));
    setAddAdminErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleAdminImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setAddAdminErrors((prev) => ({
          ...prev,
          image: "Image must be JPG or PNG",
        }));
      } else {
        setAddAdminErrors((prev) => ({ ...prev, image: null }));
        setAdminData((prev) => ({ ...prev, image: file }));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    setActionLoading(true);
    try {
      await deleteHospital(id);
      toast.success("Hospital deleted successfully");
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete hospital");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (hospital) => {
    setEditHospital({
      id: hospital.id,
      name: hospital.name,
      city: hospital.city,
      phoneNumber: hospital.phoneNumber,
      address: hospital.address,
      startTime: hospital.startTime,
      endTime: hospital.endTime,
      activeStatus: hospital.activeStatus
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateEditForm(editHospital);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setActionLoading(true);
    try {
      await updateHospital(editHospital.id, {
        city: editHospital.city,
        phoneNumber: editHospital.phoneNumber,
        address: editHospital.address,
        startTime: editHospital.startTime,
        endTime: editHospital.endTime
      });
      toast.success("Hospital updated successfully");
      setIsEditing(false);
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update hospital");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    const errors = validateAddForm(newHospital);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setActionLoading(true);
    try {
      const hospitalData = new FormData();
      hospitalData.append("systemManagerId", userId);
      Object.keys(newHospital).forEach((key) => {
        if (newHospital[key] !== null && newHospital[key] !== "") {
          hospitalData.append(key, newHospital[key]);
        }
      });
      await createHospital(hospitalData);
      toast.success("Hospital added successfully");
      setIsAdding(false);
      setNewHospital({
        name: "",
        city: "",
        identificationNumber: "",
        email: "",
        password: "",
        phoneNumber: "",
        address: "",
        image: null,
        startTime: "",
        endTime: "",
        activeStatus: true,
      });
      setImagePreview(null);
      setAddErrors({});
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add hospital");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const errors = validateAdminForm(adminData);
    setAddAdminErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      Object.keys(adminData).forEach((key) => {
        if (adminData[key] !== null && adminData[key] !== "") {
          formData.append(key, adminData[key]);
        }
      });
      await createHospitalAdmin(formData);
      toast.success("Hospital admin added successfully");
      setIsAddingAdmin(false);
      setAdminData({
        hospitalId: "",
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dob: "",
        address: "",
        nic: "",
        image: null,
        password: "",
      });
      setAddAdminErrors({});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add hospital admin");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewHospital(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleActivateDeactivate = async (id, currentStatus) => {
    setActionLoading(true);
    try {
      const updatedStatus = !currentStatus;
      await updateHospital(id, { activeStatus: updatedStatus });
      toast.success(`Hospital ${updatedStatus ? "activated" : "deactivated"}`);
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    generateHospitalReport();
  };

  const today = new Date();
  const maxDob = new Date(
    today.getFullYear() - 20,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {Manager ? (
        <>
      <DashboardSidebar />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-red-700">Hospital Dashboard</h1>

          <div className="flex flex-col items-center">
            {reportUrl && (
              <p className="text-green-600 mb-2">Report generated successfully!</p>
            )}
            <div className="flex items-center space-x-4">
              <Button
                gradientDuoTone="redToPink"
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-red-500 text-white rounded-lg hover:bg-red-700 transition"
              >
                Generate Report
              </Button>
              {reportUrl && (
                <a
                  href={`http://localhost:3020${reportUrl}`}
                  download
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download Report
                </a>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              gradientDuoTone="redToPink" 
              onClick={() => setIsAdding(true)} 
              disabled={actionLoading}
              className="bg-red-500 text-white rounded-lg hover:bg-red-700 transition" 
            >
              Add Hospital
            </Button>
            <Button 
              gradientDuoTone="redToPink" 
              onClick={() => setIsAddingAdmin(true)} 
              disabled={actionLoading}
              className="bg-red-500 text-white rounded-lg hover:bg-red-700 transition" 
            >
              Add Hospital Admin
            </Button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Filter Hospitals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label value="Name" />
              <TextInput
                id="name"
                value={filter.name}
                onChange={handleFilterChange}
                placeholder="Search by name"
                className="rounded-lg"
              />
            </div>
            <div>
              <Label value="City" />
              <TextInput
                id="city"
                value={filter.city}
                onChange={handleFilterChange}
                placeholder="Search by city"
                className="rounded-lg"
              />
            </div>
            <div>
              <Label value="Status" />
              <Select id="status" value={filter.status} onChange={handleFilterChange} className="rounded-lg">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>

        {loading && <Spinner className="mb-4" />}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Table hoverable className="w-full">
            <Table.Head className="bg-red-50 text-red-800">
              <Table.HeadCell className="px-6 py-4 font-semibold">Name</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">City</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">ID Number</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Address</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Phone</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Email</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Start Time</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">End Time</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Status</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Approval</Table.HeadCell>
              <Table.HeadCell className="px-6 py-4 font-semibold">Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y divide-gray-200">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital) => (
                  <Table.Row
                    key={hospital.id}
                    className="bg-white hover:bg-red-50 transition-colors duration-150"
                  >
                    <Table.Cell className="px-6 py-4 text-gray-900 font-medium">{hospital.name}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.city || "N/A"}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.identificationNumber}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.address}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.phoneNumber || "N/A"}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.email}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.startTime || "N/A"}</Table.Cell>
                    <Table.Cell className="px-6 py-4">{hospital.endTime || "N/A"}</Table.Cell>
                    <Table.Cell className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hospital.activeStatus ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {hospital.activeStatus ? "Active" : "Inactive"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hospital.approvalStatus === 'Approved'
                          ? "bg-green-100 text-green-700"
                          : hospital.approvalStatus === 'Rejected'
                          ? "bg-gray-200 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {hospital.approvalStatus || "Approved"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4">
                      <div className="flex space-x-2">
                        {hospital.approvalStatus === 'Pending' ? (
                          <>
                            <Button
                              size="xs"
                              color="success"
                              onClick={() => updateHospitalApproval(hospital.id, 'Approved')}
                              disabled={actionLoading}
                              className="rounded-lg bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              color="failure"
                              onClick={() => updateHospitalApproval(hospital.id, 'Rejected')}
                              disabled={actionLoading}
                              className="rounded-lg bg-red-600 hover:bg-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            {hospital.activeStatus ? (
                              <Button
                                size="xs"
                                gradientDuoTone="cyanToBlue"
                                onClick={() => handleEdit(hospital)}
                                disabled={actionLoading}
                                className="rounded-lg"
                              >
                                Edit
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="failure"
                                onClick={() => handleDelete(hospital.id)}
                                disabled={actionLoading}
                                className="rounded-lg bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </Button>
                            )}
                            <Button
                              size="xs"
                              color={hospital.activeStatus ? "failure" : "success"}
                              onClick={() => handleActivateDeactivate(hospital.id, hospital.activeStatus)}
                              disabled={actionLoading}
                              className={`rounded-lg ${hospital.activeStatus ? "bg-red-300 hover:bg-red-400" : "bg-green-600 hover:bg-green-700"}`}
                            >
                              {hospital.activeStatus ? "Deactivate" : "Activate"}
                            </Button>
                          </>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell
                    colSpan="11"
                    className="text-center py-6 text-gray-500 font-medium"
                  >
                    No hospitals found
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>

        <Modal show={isAdding} onClose={() => setIsAdding(false)} className="rounded-xl">
          <Modal.Header className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-xl">
            Add New Hospital
          </Modal.Header>
          <Modal.Body className="bg-gray-50 p-6 rounded-b-xl">
            <form onSubmit={handleAddHospital} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" value="Hospital Name" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="name"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    required
                    color={addErrors.name ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter hospital name"
                  />
                  {addErrors.name && <p className="text-red-600 text-sm mt-1">{addErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="city" value="City" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="city"
                    value={newHospital.city}
                    onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                    required
                    color={addErrors.city ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter city"
                  />
                  {addErrors.city && <p className="text-red-600 text-sm mt-1">{addErrors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="identificationNumber" value="Hospital ID (must start with HOSP)" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="identificationNumber"
                    value={newHospital.identificationNumber}
                    onChange={handleIdentificationNumberChange}
                    required
                    color={addErrors.identificationNumber ? "failure" : "gray"}
                    placeholder="HOSP12345"
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                  />
                  {addErrors.identificationNumber && (
                    <p className="text-red-600 text-sm mt-1">{addErrors.identificationNumber}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" value="Email (must end with @health.gov.lk)" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="email"
                    type="email"
                    value={newHospital.email}
                    onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                    required
                    color={addErrors.email ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="example@health.gov.lk"
                  />
                  {addErrors.email && <p className="text-red-600 text-sm mt-1">{addErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password" value="Password (min 6 characters, one special character)" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="password"
                    type="password"
                    value={newHospital.password}
                    onChange={(e) => setNewHospital({ ...newHospital, password: e.target.value })}
                    required
                    minLength={6}
                    color={addErrors.password ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter password"
                  />
                  {addErrors.password && <p className="text-red-600 text-sm mt-1">{addErrors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="phoneNumber" value="Phone Number (10 digits)" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="phoneNumber"
                    value={newHospital.phoneNumber}
                    onChange={handlePhoneNumberChange}
                    required
                    maxLength={10}
                    color={addErrors.phoneNumber ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="1234567890"
                  />
                  {addErrors.phoneNumber && <p className="text-red-600 text-sm mt-1">{addErrors.phoneNumber}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" value="Address" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="address"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                    required
                    color={addErrors.address ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter address"
                  />
                  {addErrors.address && <p className="text-red-600 text-sm mt-1">{addErrors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="image" value="Hospital Image (JPG/PNG)" className="text-gray-700 font-semibold" />
                  <FileInput
                    id="image"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    required
                    color={addErrors.image ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm"
                  />
                  {addErrors.image && <p className="text-red-600 text-sm mt-1">{addErrors.image}</p>}
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mt-4 w-32 h-32 object-cover rounded-lg shadow-md" 
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="startTime" value="Opening Time" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="startTime"
                    type="time"
                    value={newHospital.startTime}
                    onChange={(e) => setNewHospital({ ...newHospital, startTime: e.target.value })}
                    required
                    color={addErrors.startTime ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                  />
                  {addErrors.startTime && <p className="text-red-600 text-sm mt-1">{addErrors.startTime}</p>}
                </div>
                <div>
                  <Label htmlFor="endTime" value="Closing Time" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="endTime"
                    type="time"
                    value={newHospital.endTime}
                    onChange={(e) => setNewHospital({ ...newHospital, endTime: e.target.value })}
                    required
                    color={addErrors.endTime ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                  />
                  {addErrors.endTime && <p className="text-red-600 text-sm mt-1">{addErrors.endTime}</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <Button 
                  color="gray" 
                  onClick={() => setIsAdding(false)} 
                  disabled={actionLoading}
                  className="rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition shadow-md"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  gradientDuoTone="redToPink" 
                  disabled={actionLoading}
                  className="rounded-lg shadow-md hover:shadow-lg transition"
                >
                  {actionLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : "Add Hospital"}
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>

        <Modal show={isEditing} onClose={() => setIsEditing(false)}>
          <Modal.Header>Edit Hospital</Modal.Header>
          <Modal.Body>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="editCity" value="City" />
                <TextInput
                  id="editCity"
                  value={editHospital?.city || ""}
                  onChange={(e) => setEditHospital(prev => ({ ...prev, city: e.target.value }))}
                  required
                  color={editErrors.city ? "failure" : "gray"}
                  className="rounded-lg"
                />
                {editErrors.city && <p className="text-red-600 text-sm mt-1">{editErrors.city}</p>}
              </div>
              <div>
                <Label htmlFor="editPhoneNumber" value="Phone Number (10 digits)" />
                <TextInput
                  id="editPhoneNumber"
                  value={editHospital?.phoneNumber || ""}
                  onChange={(e) => handlePhoneNumberChange(e, true)}
                  required
                  maxLength={10}
                  color={editErrors.phoneNumber ? "failure" : "gray"}
                  className="rounded-lg"
                />
                {editErrors.phoneNumber && <p className="text-red-600 text-sm mt-1">{editErrors.phoneNumber}</p>}
              </div>
              <div>
                <Label htmlFor="editAddress" value="Address" />
                <TextInput
                  id="editAddress"
                  value={editHospital?.address || ""}
                  onChange={(e) => setEditHospital(prev => ({ ...prev, address: e.target.value }))}
                  required
                  color={editErrors.address ? "failure" : "gray"}
                  className="rounded-lg"
                />
                {editErrors.address && <p className="text-red-600 text-sm mt-1">{editErrors.address}</p>}
              </div>
              <div>
                <Label htmlFor="editStartTime" value="Opening Time" />
                <TextInput
                  id="editStartTime"
                  type="time"
                  value={editHospital?.startTime || ""}
                  onChange={(e) => setEditHospital(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                  color={editErrors.startTime ? "failure" : "gray"}
                  className="rounded-lg"
                />
                {editErrors.startTime && <p className="text-red-600 text-sm mt-1">{editErrors.startTime}</p>}
              </div>
              <div>
                <Label htmlFor="editEndTime" value="Closing Time" />
                <TextInput
                  id="editEndTime"
                  type="time"
                  value={editHospital?.endTime || ""}
                  onChange={(e) => setEditHospital(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                  color={editErrors.endTime ? "failure" : "gray"}
                  className="rounded-lg"
                />
                {editErrors.endTime && <p className="text-red-600 text-sm mt-1">{editErrors.endTime}</p>}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  color="gray" 
                  onClick={() => setIsEditing(false)} 
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  gradientDuoTone="redToPink" 
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  {actionLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : "Update Hospital"}
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>

        <Modal show={isAddingAdmin} onClose={() => setIsAddingAdmin(false)} className="rounded-xl">
          <Modal.Header className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-xl">
            Add New Hospital Admin
          </Modal.Header>
          <Modal.Body className="bg-gray-50 p-6 rounded-b-xl">
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="hospitalId" value="Select Hospital" className="text-gray-700 font-semibold" />
                  <Select
                    id="hospitalId"
                    required
                    value={adminData.hospitalId}
                    onChange={handleAdminChange}
                    color={addAdminErrors.hospitalId ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm"
                  >
                    <option value="" disabled>Select a hospital</option>
                    {hospitals && hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </Select>
                  {addAdminErrors.hospitalId && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.hospitalId}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" value="Email" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="email"
                    value={adminData.email}
                    onChange={handleAdminChange}
                    required
                    color={addAdminErrors.email ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="example@health.gov.lk"
                  />
                  {addAdminErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="firstName" value="First Name" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="firstName"
                    value={adminData.firstName}
                    onChange={handleAdminChange}
                    required
                    color={addAdminErrors.firstName ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter first name"
                  />
                  {addAdminErrors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" value="Last Name" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="lastName"
                    value={adminData.lastName}
                    onChange={handleAdminChange}
                    required
                    color={addAdminErrors.lastName ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter last name"
                  />
                  {addAdminErrors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phoneNumber" value="Phone Number" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="phoneNumber"
                    value={adminData.phoneNumber}
                    onChange={handleAdminChange}
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    color={addAdminErrors.phoneNumber ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="1234567890"
                  />
                  {addAdminErrors.phoneNumber && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dob" value="Date of Birth" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="dob"
                    type="date"
                    value={adminData.dob}
                    onChange={handleAdminChange}
                    required
                    max={maxDob}
                    color={addAdminErrors.dob ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                  />
                  {addAdminErrors.dob && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.dob}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" value="Address" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="address"
                    value={adminData.address}
                    onChange={handleAdminChange}
                    required
                    color={addAdminErrors.address ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter address"
                  />
                  {addAdminErrors.address && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.address}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nic" value="NIC" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="nic"
                    value={adminData.nic}
                    onChange={handleAdminChange}
                    required
                    pattern="[0-9]{12}"
                    maxLength={12}
                    color={addAdminErrors.nic ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="123456789012"
                  />
                  {addAdminErrors.nic && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.nic}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password" value="Password" className="text-gray-700 font-semibold" />
                  <TextInput
                    id="password"
                    type="password"
                    value={adminData.password}
                    onChange={handleAdminChange}
                    required
                    color={addAdminErrors.password ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 transition"
                    placeholder="Enter password"
                  />
                  {addAdminErrors.password && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.password}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="image" value="Profile Image (Optional)" className="text-gray-700 font-semibold" />
                  <FileInput
                    id="image"
                    accept="image/jpeg,image/png"
                    onChange={handleAdminImageUpload}
                    color={addAdminErrors.image ? "failure" : "gray"}
                    className="mt-1 rounded-lg shadow-sm"
                  />
                  {addAdminErrors.image && (
                    <p className="text-red-600 text-sm mt-1">{addAdminErrors.image}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  color="gray"
                  onClick={() => setIsAddingAdmin(false)}
                  disabled={actionLoading}
                  className="rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition shadow-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  gradientDuoTone="redToPink"
                  disabled={actionLoading}
                  className="rounded-lg shadow-md hover:shadow-lg transition"
                >
                  {actionLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : "Add Hospital Admin"}
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
      </div>
      </>
    ) : (
  <div className="flex min-h-screen items-center justify-center">
    <p className="text-red-600 text-lg">Access Denied: Manager role required</p>
  </div>
)}
    </div>
  );
}