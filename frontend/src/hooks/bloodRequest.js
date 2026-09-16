import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useBloodRequest = () => {
  const [loading, setLoading] = useState(false);

  const createBloodRequest = async (requestData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/blood-request', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Blood request created successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create blood request';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBloodRequestsByReceiver = async (receiverId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/receiver/${receiverId}/blood-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch blood requests');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAllBloodRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/blood-request', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch blood requests');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBloodRequestStatus = async (requestId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/blood-request/${requestId}/status`, { status }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Request status updated successfully!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update request status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const searchDonors = async (bloodType, city) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/receiver/search/donors', {
        params: { bloodType, city },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to search donors');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkHospitalStock = async (bloodType, city) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/blood-request/stock/check', {
        params: { bloodType, city },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to check hospital stock');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createBloodRequest,
    getBloodRequestsByReceiver,
    getAllBloodRequests,
    updateBloodRequestStatus,
    searchDonors,
    checkHospitalStock,
  };
};
