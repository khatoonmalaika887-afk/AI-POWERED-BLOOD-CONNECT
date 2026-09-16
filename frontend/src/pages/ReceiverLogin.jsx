import React, { useState } from "react";
import { Button, Card, Label, TextInput, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useReceiver } from "../hooks/receiver";
import { toast } from "react-toastify";
import SocialLogin from '../components/SocialLogin';
import background from '../assets/bg1.jpg';

export default function ReceiverLogin() {
  const navigate = useNavigate();
  const { loginReceiver, loading } = useReceiver();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await loginReceiver(formData);
      toast.success('Login successful!');
      navigate('/receiver-dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <h2 className="text-3xl font-extrabold">Receiver Login</h2>
          <p className="mt-2 text-sm">
            Sign in to your receiver account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" value="Email" className="text-gray-800 font-semibold" />
            <TextInput
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              color={errors.password ? "failure" : "gray"}
              className="mt-2 rounded-xl border-red-100 focus:ring-red-300 focus:border-red-300 transition-all duration-200"
            />
            {errors.password && <p className="text-red-600 text-sm mt-2">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            gradientDuoTone="redToPink"
            size="xl"
            className="w-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-red-500 to-pink-500"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-3" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div className="text-center space-y-2">
            <button
              onClick={() => navigate("/receiver-register")}
              className="text-red-600 font-semibold hover:text-pink-600 hover:underline focus:outline-none transition-colors duration-200"
              disabled={loading}
            >
              Don't have an account? Register
            </button>
          </div>
          
          <SocialLogin 
            userType="receiver" 
            onLoginSuccess={(data) => {
              localStorage.setItem('user', JSON.stringify(data));
              navigate('/dashboard');
            }} 
          />
        </form>
      </div>
    </div>
  );
}
