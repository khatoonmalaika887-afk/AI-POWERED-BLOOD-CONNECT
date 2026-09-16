import React, { useState } from "react";
import { Button, Card, Label, TextInput, Select, FileInput, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useHospital } from "../hooks/hospital";
import { toast } from 'react-toastify';
import { FaGoogle, FaFacebook, FaInstagram } from "react-icons/fa";
import background from '../assets/bg1.jpg';

export default function HospitalRegister() {
  const navigate = useNavigate();
  const { registerHospital, loading } = useHospital();
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    identificationNumber: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    startTime: "",
    endTime: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.identificationNumber) {
      newErrors.identificationNumber = 'Identification number is required';
    } else if (!/^\d{10}$/.test(formData.identificationNumber)) {
      newErrors.identificationNumber = 'Identification number must be exactly 10 digits';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.image) newErrors.image = 'Hospital image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handleNumericChange = (e) => {
    const { id, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [id]: value }));
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
    }
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const hospitalData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      hospitalData.append(key, value);
    });

    try {
      const result = await registerHospital(hospitalData);
      toast.success(result?.message || 'Registration submitted! Please wait for admin approval before logging in.');
      navigate("/hospital-login");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error registering hospital');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <Card className="w-full max-w-5xl p-12 shadow-xl rounded-3xl bg-white bg-opacity-90 backdrop-blur-xl border border-red-100 transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-10 drop-shadow-lg">
          Hospital Registration
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
          <div className="space-y-8">
            <div>
              <Label htmlFor="name" value="Hospital Name" className="text-gray-800 font-semibold" />
              <TextInput
                id="name"
                type="text"
                placeholder="Enter hospital name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.name ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.name && <span className="text-red-600 text-sm">{errors.name}</span>}
              />
            </div>

            <div>
              <Label htmlFor="city" value="City" className="text-gray-800 font-semibold" />
              <Select
                id="city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.city ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </Select>
              {errors.city && <p className="text-red-600 text-sm mt-2">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor="identificationNumber" value="Identification Number" className="text-gray-800 font-semibold" />
              <TextInput
                id="identificationNumber"
                type="text"
                placeholder="Enter 10-digit identification number"
                value={formData.identificationNumber}
                onChange={handleNumericChange}
                required
                maxLength={10}
                disabled={loading}
                color={errors.identificationNumber ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.identificationNumber && <span className="text-red-600 text-sm">{errors.identificationNumber}</span>}
              />
            </div>

            <div>
              <Label htmlFor="email" value="Email" className="text-gray-800 font-semibold" />
              <TextInput
                id="email"
                type="email"
                placeholder="hospital@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.email ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.email && <span className="text-red-600 text-sm">{errors.email}</span>}
              />
            </div>

            <div>
              <Label htmlFor="password" value="Password" className="text-gray-800 font-semibold" />
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading}
                color={errors.password ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.password && <span className="text-red-600 text-sm">{errors.password}</span>}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <Label htmlFor="phoneNumber" value="Phone Number" className="text-gray-800 font-semibold" />
              <TextInput
                id="phoneNumber"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formData.phoneNumber}
                onChange={handleNumericChange}
                required
                maxLength={10}
                disabled={loading}
                color={errors.phoneNumber ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.phoneNumber && <span className="text-red-600 text-sm">{errors.phoneNumber}</span>}
              />
            </div>

            <div>
              <Label htmlFor="address" value="Address" className="text-gray-800 font-semibold" />
              <TextInput
                id="address"
                type="text"
                placeholder="Enter full address"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.address ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.address && <span className="text-red-600 text-sm">{errors.address}</span>}
              />
            </div>

            <div>
              <Label htmlFor="startTime" value="Start Time" className="text-gray-800 font-semibold" />
              <TextInput
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.startTime ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.startTime && <span className="text-red-600 text-sm">{errors.startTime}</span>}
              />
            </div>

            <div>
              <Label htmlFor="endTime" value="End Time" className="text-gray-800 font-semibold" />
              <TextInput
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
                disabled={loading}
                color={errors.endTime ? 'failure' : 'gray'}
                className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
                helperText={errors.endTime && <span className="text-red-600 text-sm">{errors.endTime}</span>}
              />
            </div>

            <div>
              <Label htmlFor="image" value="Hospital Image (JPG/PNG)" className="text-gray-800 font-semibold" />
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

            <div className="flex items-center w-full max-w-md">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">or continue with</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-[#3E0703] hover:bg-[#660B05] text-white rounded-full shadow-lg transition-all duration-300"
                onClick={() => toast.info('Google login coming soon!')}
              >
                <FaGoogle className="text-lg" />
              </Button>
              <Button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-[#660B05] hover:bg-[#8C1007] text-white rounded-full shadow-lg transition-all duration-300"
                onClick={() => toast.info('Facebook login coming soon!')}
              >
                <FaFacebook className="text-lg" />
              </Button>
              <Button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-[#8C1007] hover:bg-[#FFF0C4] text-white rounded-full shadow-lg transition-all duration-300"
                onClick={() => toast.info('Instagram login coming soon!')}
              >
                <FaInstagram className="text-lg" />
              </Button>
            </div>

            <button
              onClick={() => navigate("/hospital-login")}
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
