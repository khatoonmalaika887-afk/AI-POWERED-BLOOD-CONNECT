import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useDonor = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDonors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/donor");
            setDonors(response.data);
           
        } catch (err) {
            console.error("Error fetching donors:", err);
            
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDonorById = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/donor/${id}`);
            setDonors([response.data]);
           
        } catch (err) {
            console.error("Error fetching donor:", err);
            
        } finally {
            setLoading(false);
        }
    }, []);

    const createDonor = async (donorData) => {
        try {
            const response = await axios.post("/api/donor", donorData);
            setDonors((prev) => [...prev, response.data]);
            return response.data;
        } catch (err) {
            console.error("Error creating donor:", err);
            throw err;
        }
    };

    const updateDonor = async (id, donorData) => {
        setLoading(true);
        try {
            const response = await axios.put(`/api/donor/${id}`, donorData, {
                headers: { "Content-Type": "application/json" },
            });
            setDonors((prev) =>
                prev.map((donor) =>
                    donor._id === id ? { ...donor, ...response.data } : donor
                )
            );
            toast.success("Donor updated successfully!");
        } catch (err) {
            console.error("Error updating donor:", err);
            toast.error(err?.response?.data?.message || "Error updating donor");
        } finally {
            setLoading(false);
        }
    };

    const deleteDonor = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`/api/donor/${id}`);
            setDonors((prev) => prev.filter((donor) => donor._id !== id));
            toast.success("Donor deleted successfully!");
        } catch (err) {
            console.error("Error deleting donor:", err);
            toast.error(err?.response?.data?.message || "Error deleting donor");
        } finally {
            setLoading(false);
        }
    };

    const activateDeactivateDonor = async (id) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/donor/${id}/toggle-status`);
            setDonors((prev) =>
                prev.map((donor) =>
                    donor._id === id ? { ...donor, activeStatus: !donor.activeStatus } : donor
                )
            );
            toast.success("Donor status toggled successfully!");
        } catch (err) {
            console.error("Error toggling donor status:", err);
            toast.error(err?.response?.data?.message || "Error toggling donor status");
        } finally {
            setLoading(false);
        }
    };

    return {
        donors,
        loading,
        fetchDonors,
        fetchDonorById,
        createDonor,
        updateDonor,
        deleteDonor,
        activateDeactivateDonor,
    };
};