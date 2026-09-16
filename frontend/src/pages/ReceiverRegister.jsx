import React, { useState } from "react";
import { Button, Card, Label, TextInput, Select, FileInput, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useReceiver } from "../hooks/receiver";
import { toast } from 'react-toastify';

export default function ReceiverRegister() {
  const navigate = useNavigate();
  const { createReceiver, loading } = useReceiver();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    dob: "",
    bloodType: "",
    gender: "",
    city: "",
    nic: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const genders = ["Male", "Female", "Other"];

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    // Name validations
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Phone validation (exactly 10 digits)
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (min 8 chars, at least one special character)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Date of Birth validation (must be at least 18 years old)
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      if (dobDate >= today) {
        newErrors.dob = 'Date of birth must be in the past';
      } else if (dobDate > minAgeDate) {
        newErrors.dob = 'You must be at least 18 years old';
      }
    }

    // Other validations
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.nic.trim()) newErrors.nic = 'NIC is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createReceiver(formData);
      toast.success('Registration successful!');
      navigate('/receiver-login');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-red-400 to-red-600 p-6">
      <Card className="w-full max-w-4xl p-8 shadow-2xl rounded-3xl bg-white bg-opacity-95 border border-red-100">
        <h2 className="text-3xl font-bold text-center text-red-700 mb-6">Receiver Registration</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" value="First Name" className="text-gray-800 font-semibold" />
              <TextInput
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.firstName ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.firstName && <p className="text-red-600 text-sm mt-2">{errors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="lastName" value="Last Name" className="text-gray-800 font-semibold" />
              <TextInput
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.lastName ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.lastName && <p className="text-red-600 text-sm mt-2">{errors.lastName}</p>}
            </div>

            <div>
              <Label htmlFor="phoneNumber" value="Phone Number" className="text-gray-800 font-semibold" />
              <TextInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="0712345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.phoneNumber ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.phoneNumber && <p className="text-red-600 text-sm mt-2">{errors.phoneNumber}</p>}
            </div>

            <div>
              <Label htmlFor="email" value="Email" className="text-gray-800 font-semibold" />
              <TextInput
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.email ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.email && <p className="text-red-600 text-sm mt-2">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" value="Password" className="text-gray-800 font-semibold" />
              <TextInput
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.password ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.password && <p className="text-red-600 text-sm mt-2">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="dob" value="Date of Birth" className="text-gray-800 font-semibold" />
              <TextInput
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.dob ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.dob && <p className="text-red-600 text-sm mt-2">{errors.dob}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bloodType" value="Blood Type" className="text-gray-800 font-semibold" />
              <Select
                id="bloodType"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.bloodType ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              >
                <option value="">Select Blood Type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
              {errors.bloodType && <p className="text-red-600 text-sm mt-2">{errors.bloodType}</p>}
            </div>

            <div>
              <Label htmlFor="gender" value="Gender" className="text-gray-800 font-semibold" />
              <Select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.gender ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              >
                <option value="">Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </Select>
              {errors.gender && <p className="text-red-600 text-sm mt-2">{errors.gender}</p>}
            </div>

            <div>
              <Label htmlFor="city" value="City" className="text-gray-800 font-semibold" />
              <TextInput
                id="city"
                name="city"
                type="text"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.city ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.city && <p className="text-red-600 text-sm mt-2">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor="nic" value="NIC" className="text-gray-800 font-semibold" />
              <TextInput
                id="nic"
                name="nic"
                type="text"
                placeholder="Enter NIC"
                value={formData.nic}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.nic ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              />
              {errors.nic && <p className="text-red-600 text-sm mt-2">{errors.nic}</p>}
            </div>

            <div>
              <Label htmlFor="image" value="Profile Image (JPG/PNG)" className="text-gray-800 font-semibold" />
              <FileInput
                id="image"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                required
                disabled={loading}
                color={errors.image ? "failure" : "gray"}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.image && <span className="text-red-600 text-sm">{errors.image}</span>}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-4 w-40 h-40 object-cover rounded-xl shadow-md border border-red-100"
                />
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col items-center space-y-6">
            <Button
              type="submit"
              gradientDuoTone="redToPink"
              size="xl"
              className="w-full max-w-md font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-red-500 to-pink-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-3" />
                  Registering...
                </>
              ) : (
                'Register Now'
              )}
            </Button>
            <button
              onClick={() => navigate("/receiver-login")}
              className="text-red-600 font-semibold hover:text-pink-600 hover:underline focus:outline-none transition-colors duration-200"
              disabled={loading}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
