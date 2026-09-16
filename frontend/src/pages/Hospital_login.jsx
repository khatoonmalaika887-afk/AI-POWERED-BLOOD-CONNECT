import React, { useState } from "react";
import { Button, Card, Label, TextInput, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useSignin } from "../hooks/useSignin";
import { toast } from 'react-toastify';
import SocialLogin from '../components/SocialLogin';
import background from '../assets/bg1.jpg';

export default function HospitalLogin() {
  const navigate = useNavigate();
  const { signinH, loading } = useSignin();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.trim() }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form and handle client-side errors
    if (!validateForm()) {
      if (errors.email) toast.error(errors.email);
      if (errors.password) toast.error(errors.password);
      return;
    }

    try {
      await signinH(formData); // Let useSignin handle success (toast, navigation)
    } catch (err) {
      // Handle network or unexpected errors
      const errorMsg =
        err?.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Network error. Please check your connection.'
          : 'Login failed. Please try again.');
      handleErrorResponse(errorMsg);
    }
  };

  // Helper function to handle errors consistently
  const handleErrorResponse = (errorMsg) => {
    const lowerMsg = errorMsg.toLowerCase();

    if (lowerMsg.includes('password')) {
      toast.error('Incorrect password. Please enter valid password');
      setErrors((prev) => ({ ...prev, password: 'Incorrect password' }));
    } else if (lowerMsg.includes('email') || lowerMsg.includes('hospital')) {
      toast.error('Email not found. Please enter valid email');
      setErrors((prev) => ({ ...prev, email: 'Email not found' }));
    } else {
      toast.error(errorMsg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <h2 className="text-3xl font-extrabold">Hospital Login</h2>
          <p className="mt-2 text-sm">
            Sign in to your hospital account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label 
              htmlFor="email" 
              value="Hospital Email" 
              className="text-gray-800 font-semibold tracking-wide" 
            />
            <TextInput
              id="email"
              type="email"
              placeholder="hospital@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              color={errors.email ? 'failure' : 'gray'}
              className="mt-2 rounded-lg border-gray-200 focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all duration-300 bg-white/70"
              aria-label="Hospital email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <Label 
              htmlFor="password" 
              value="Password" 
              className="text-gray-800 font-semibold tracking-wide" 
            />
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
              color={errors.password ? 'failure' : 'gray'}
              className="mt-2 rounded-lg border-gray-200 focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all duration-300 bg-white/70"
              aria-label="Hospital password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5 font-medium animate-fade-in">
                {errors.password}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-pink-600 focus:ring-4 focus:ring-red-200 transition-all duration-300 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate("/hospital-register")}
              className="text-red-600 font-semibold hover:text-pink-600 hover:underline focus:outline-none transition-colors duration-200"
              disabled={loading}
            >
              Don't have an account? Register
            </button>
          </div>

          <SocialLogin
            userType="hospital"
            onLoginSuccess={(data) => {
              localStorage.setItem('user', JSON.stringify(data));
              navigate('/HospitalAdminLogin');
            }} 
          />
        </form>
      </div>
    </div>
  );
}