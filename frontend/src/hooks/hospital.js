import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useHospital = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHospitals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/hospital");
            setHospitals(response.data);
        } catch (err) {
            console.error("Error fetching hospitals:", err);

        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHospitalById = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/hospital/${id}`);
            setHospitals([response.data]);

        } catch (err) {
            console.error("Error fetching hospital:", err);

        } finally {
            setLoading(false);
        }
    }, []);

    const createHospital = async (hospitalData) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/hospital", hospitalData);
            setHospitals((prev) => [...prev, response.data]);
            return response.data;
        } catch (err) {
            console.error("Error creating hospital:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Public self-registration - hospital stays pending until a manager approves it.
    const registerHospital = async (hospitalData) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/hospital/register", hospitalData);
            return response.data;
        } catch (err) {
            console.error("Error registering hospital:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateHospital = async (id, hospitalData) => {
        setLoading(true);
        try {
            const response = await axios.put(`/api/hospital/${id}`, hospitalData);
            setHospitals((prev) =>
                prev.map((hospital) =>
                    hospital.id === id ? { ...hospital, ...response.data } : hospital
                )
            );
            toast.success("Hospital updated successfully!");
        } catch (err) {
            console.error("Error updating hospital:", err);
            toast.error(err?.response?.data?.message || "Failed to update hospital");
        } finally {
            setLoading(false);
        }
    };

    const deleteHospital = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`/api/hospital/${id}`);
            setHospitals((prev) => prev.filter((hospital) => hospital.id !== id));
            toast.success("Hospital deleted successfully!");
        } catch (err) {
            console.error("Error deleting hospital:", err);
            toast.error(err?.response?.data?.message || "Failed to delete hospital");
        } finally {
            setLoading(false);
        }
    };

    const activateDeactivateHospital = async (id) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/hospital/${id}/toggle-status`);
            setHospitals((prev) =>
                prev.map((hospital) =>
                    hospital.id === id ? { ...hospital, activeStatus: !hospital.activeStatus } : hospital
                )
            );
            toast.success("Hospital status toggled successfully!");
        } catch (err) {
            console.error("Error toggling hospital status:", err);
            toast.error(err?.response?.data?.message || "Failed to toggle hospital status");
        } finally {
            setLoading(false);
        }
    };

    // decision: 'Approved' | 'Rejected'
    const updateHospitalApproval = async (id, decision) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/hospital/${id}/approval`, { decision });
            setHospitals((prev) =>
                prev.map((hospital) =>
                    hospital.id === id ? { ...hospital, ...response.data.hospital } : hospital
                )
            );
            toast.success(`Hospital ${decision.toLowerCase()}`);
        } catch (err) {
            console.error("Error updating hospital approval:", err);
            toast.error(err?.response?.data?.message || "Failed to update hospital approval");
        } finally {
            setLoading(false);
        }
    };

    return {
        hospitals,
        loading,
        fetchHospitals,
        fetchHospitalById,
        createHospital,
        registerHospital,
        updateHospital,
        deleteHospital,
        activateDeactivateHospital,
        updateHospitalApproval,
    };
};
