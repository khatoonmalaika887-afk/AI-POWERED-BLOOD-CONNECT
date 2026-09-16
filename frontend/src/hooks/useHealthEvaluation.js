import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useHealthEvaluation = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");
    
    const fetchEvaluations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/healthEvaluation");
            setEvaluations(response.data);
        } catch (err) {
            console.error("Error fetching evaluations:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvaluationByDonorId = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/healthEvaluation/donor/${id}`);
            setEvaluations(response.data);
        } catch (err) {
            console.error("Error fetching evaluations by donor:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvaluationByHospitalId = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/healthEvaluation/hospital/${id}`);
            setEvaluations(response.data);
        } catch (err) {
            console.error("Error fetching evaluations by hospital:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvaluationById = useCallback(async (id) => {
        try {
            const response = await axios.get(`/api/healthEvaluation/${id}`);
            return response.data;
        } catch (err) {
            console.error("Error fetching evaluation:", err);
            return null;
        }
    }, []);

    const createEvaluation = async (evaluationData) => {
        try {
            const response = await axios.post("/api/healthEvaluation", evaluationData);
            setEvaluations((prev) => [...prev, response.data]);
            toast.success("Evaluation created successfully!");
        } catch (err) {
            console.error("Error creating evaluation:", err);
            toast.error(err?.response?.data?.message || "Error creating evaluation");
        }
    };

    const updateEvaluationDateTime = async (id, evaluationDate, evaluationTime) => {
        try {
            const response = await axios.patch(`/api/healthEvaluation/${id}/date-time`, { evaluationDate, evaluationTime });
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Date and time updated successfully!");
        } catch (err) {
            console.error("Error updating date and time:", err);
            toast.error(err?.response?.data?.message || "Error updating date and time");
        }
    };

    const cancelEvaluation = async (id, hospitalAdminId, userId) => {
        try {
            const response = await axios.patch(`/api/healthEvaluation/${id}/cancel`, { hospitalAdminId, userId });
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Evaluation canceled successfully!");
        } catch (err) {
            console.error("Error canceling evaluation:", err);
            toast.error(err?.response?.data?.message || "Error canceling evaluation");
        }
    };

    const acceptEvaluation = async (id, hospitalAdminId) => {
        try {
            const response = await axios.patch(`/api/healthEvaluation/${id}/accept`, { hospitalAdminId });
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Evaluation accepted successfully!");
        } catch (err) {
            console.error("Error accepting evaluation:", err);
            toast.error(err?.response?.data?.message || "Error accepting evaluation");
        }
    };

    const arrivedForEvaluation = async (id, receiptNumber) => {
        try {
            const response = await axios.patch(`/api/healthEvaluation/${id}/arrived`, { receiptNumber });
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Marked as arrived successfully!");
        } catch (err) {
            console.error("Error marking as arrived:", err);
            toast.error(err?.response?.data?.message || "Error marking as arrived");
        }
    };

    const completeEvaluation = async (id, result, selectedFile) => {
        try {
            const formData = new FormData();
            formData.append("evaluationFile", selectedFile);
            formData.append("result", result);

            const response = await axios.patch(`/api/healthEvaluation/${id}/complete`, formData);
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Evaluation completed successfully!");
        } catch (err) {
            console.error("Error completing evaluation:", err);
            toast.error(err?.response?.data?.message || "Error completing evaluation");
        }
    };

    const deleteEvaluation = async (id) => {
        try {
            await axios.delete(`/api/healthEvaluation/${id}`);
            setEvaluations((prev) => prev.filter((evaluation) => evaluation.id !== id));
            toast.success("Evaluation deleted successfully!");
        } catch (err) {
            console.error("Error deleting evaluation:", err);
            toast.error(err?.response?.data?.message || "Error deleting evaluation");
        }
    };

    const cancelEvaluationDonor = async (id, userId) => {
        try {
            const response = await axios.patch(`/api/healthEvaluation/${id}/cancelD`);
            setEvaluations((prev) =>
                prev.map((evaluation) => (evaluation.id === id ? response.data : evaluation))
            );
            toast.success("Evaluation canceled successfully!");
        } catch (err) {
            console.error("Error canceling evaluation for donor:", err);
            toast.error(err?.response?.data?.message || "Error canceling evaluation for donor");
        }
    };

    const findLastUpdatedEvaluationByDonor = async (id) => {
        try {
            const response = await axios.get(`/api/healthEvaluation/donor/${id}/last-updated`);
            return response.data;
        } catch (err) {
            console.error("Error fetching last updated evaluation by donor:", err);
            toast.error(err?.response?.data?.message || "Error fetching last updated evaluation by donor");
            return null;
        }
    };

    return {
        evaluations,
        loading,
        fetchEvaluations,
        fetchEvaluationById,
        fetchEvaluationByDonorId,
        fetchEvaluationByHospitalId,
        createEvaluation,
        updateEvaluationDateTime,
        cancelEvaluation,
        acceptEvaluation,
        arrivedForEvaluation,
        cancelEvaluationDonor,
        completeEvaluation,
        deleteEvaluation,
        findLastUpdatedEvaluationByDonor,
    };
};