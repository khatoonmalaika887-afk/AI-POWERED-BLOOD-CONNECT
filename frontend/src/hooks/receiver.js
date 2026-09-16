import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useReceiver = () => {
  const [loading, setLoading] = useState(false);
  const [receivers, setReceivers] = useState([]);
  const [user, setUser] = useState(null);

  const createReceiver = async (receiverData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(receiverData).forEach(key => {
        if (receiverData[key] !== null && receiverData[key] !== undefined) {
          formData.append(key, receiverData[key]);
        }
      });

      const response = await axios.post('/api/receiver', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating receiver:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginReceiver = async (credentials) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/receiver-login', credentials);
      const { token, receiver } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...receiver, role: 'Receiver' }));
      setUser({ ...receiver, role: 'Receiver' });

      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

const getReceiverProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/receiver/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateReceiver = async (receiverData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.keys(receiverData).forEach(key => {
        if (receiverData[key] !== null && receiverData[key] !== undefined) {
          formData.append(key, receiverData[key]);
        }
      });

      const response = await axios.put('/api/receiver/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

const fetchReceivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/receiver");
      const data = response.data;
      // Handle both array response and single object response
      setReceivers(Array.isArray(data) ? data : [data]);
      return data;
    } catch (error) {
      console.error("Error fetching receivers:", error);
      setReceivers([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    receivers,
    user,
    loading,
    createReceiver,
    loginReceiver,
    getReceiverProfile,
    updateReceiver,
    fetchReceivers,
  };
};
