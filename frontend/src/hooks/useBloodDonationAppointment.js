import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useBloodDonationAppointment = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/blooddonationappointment");
            setAppointments(response.data);
            
        } catch (err) {
            console.error("Error fetching appointments:", err);
            
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAppointmentById = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/blooddonationappointment/${id}`);
            
            return response.data;
        } catch (err) {
            console.error("Error fetching appointment:", err);
            
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createAppointment = async (appointmentData) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/blooddonationappointment", appointmentData);
            setAppointments((prev) => [...prev, response.data]);
            toast.success("Blood donation appointment created successfully!");
        } catch (err) {
            console.error("Error creating appointment:", err);
            toast.error(err?.response?.data?.message || "Failed to create appointment");
        } finally {
            setLoading(false);
        }
    };

    const updateAppointmentDateTime = async (id, appointmentDate, appointmentTime, hospitalAdminId) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/blooddonationappointment/${id}/date-time`, {
                appointmentDate,
                appointmentTime,
                hospitalAdminId,
            });
            setAppointments((prev) =>
                prev.map((appointment) => (appointment.id === id ? response.data : appointment))
            );
            toast.success("Appointment date and time updated successfully!");
        } catch (err) {
            console.error("Error updating appointment date/time:", err);
            toast.error(err?.response?.data?.message || "Failed to update appointment date/time");
        } finally {
            setLoading(false);
        }
    };

    const cancelAppointment = async (id, hospitalAdminId) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/blooddonationappointment/${id}/cancel`, {
                hospitalAdminId,
            });
            setAppointments((prev) =>
                prev.map((appointment) => (appointment.id === id ? response.data : appointment))
            );
            toast.success("Appointment canceled successfully!");
        } catch (err) {
            console.error("Error canceling appointment:", err);
            toast.error(err?.response?.data?.message || "Failed to cancel appointment");
        } finally {
            setLoading(false);
        }
    };

    const acceptAppointment = async (id, hospitalAdminId) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/blooddonationappointment/${id}/accept`, {
                hospitalAdminId,
            });
            setAppointments((prev) =>
                prev.map((appointment) => (appointment.id === id ? response.data : appointment))
            );
            toast.success("Appointment accepted successfully!");
        } catch (err) {
            console.error("Error accepting appointment:", err);
            toast.error(err?.response?.data?.message || "Failed to accept appointment");
        } finally {
            setLoading(false);
        }
    };

    const arrivedForAppointment = async (id, receiptNumber) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/blooddonationappointment/${id}/arrived`, {
                receiptNumber,
            });
            setAppointments((prev) =>
                prev.map((appointment) => (appointment.id === id ? response.data : appointment))
            );
            toast.success("Appointment marked as arrived successfully!");
        } catch (err) {
            console.error("Error marking appointment as arrived:", err);
            toast.error(err?.response?.data?.message || "Failed to mark as arrived");
        } finally {
            setLoading(false);
        }
    };

    const completeAppointment = async (id, units = 1) => {
        setLoading(true);
        try {
            const response = await axios.patch(`/api/blooddonationappointment/${id}/complete`, { units });
            setAppointments((prev) =>
                prev.map((appointment) => (appointment.id === id ? response.data : appointment))
            );
            toast.success("Appointment completed successfully!");
        } catch (err) {
            console.error("Error completing appointment:", err);
            toast.error(err?.response?.data?.message || "Failed to complete appointment");
        } finally {
            setLoading(false);
        }
    };

    const deleteAppointment = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`/api/blooddonationappointment/${id}`);
            setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
            toast.success("Appointment deleted successfully!");
        } catch (err) {
            console.error("Error deleting appointment:", err);
            toast.error(err?.response?.data?.message || "Failed to delete appointment");
        } finally {
            setLoading(false);
        }
    };

    const fetchBloodDonationAppointmentByDonorId =useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/blooddonationappointment/donor/${id}`);
            setAppointments(response.data);
            toast.success("Appointments by donor fetched successfully!");
        } catch (err) {
            console.error("Error fetching appointments by donor:", err);
            toast.error(err?.response?.data?.message || "Failed to fetch appointments by donor");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBloodDonationAppointmentByHospitalId = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/blooddonationappointment/hospital/${id}`);
            setAppointments(response.data);
            toast.success("Appointments by hospital fetched successfully!");
        } catch (err) {
            console.error("Error fetching appointments by hospital:", err);
            toast.error(err?.response?.data?.message || "Failed to fetch appointments by hospital");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        appointments,
        loading,
        fetchAppointments,
        fetchAppointmentById,
        createAppointment,
        updateAppointmentDateTime,
        deleteAppointment,
        arrivedForAppointment,
        acceptAppointment,
        completeAppointment,
        cancelAppointment,
        fetchBloodDonationAppointmentByHospitalId,
        fetchBloodDonationAppointmentByDonorId,
    };
};