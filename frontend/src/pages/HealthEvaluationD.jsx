import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Label, TextInput, FileInput, Spinner, Textarea, Select } from "flowbite-react";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { useHealthEvaluation } from "../hooks/useHealthEvaluation";
import { useSecondAuth } from "../hooks/useSecondAuth";
import { useAuthContext } from "../hooks/useAuthContext";
import { useFeedback } from "../hooks/usefeedback";
import { useGenerateReport } from "../hooks/useGenerateReport";

export default function AppointmentD() {
  const {
    evaluations,
    fetchEvaluationByDonorId,
    fetchEvaluationByHospitalId,
    fetchEvaluations,
    deleteEvaluation,
    updateEvaluationDateTime,
    acceptEvaluation,
    cancelEvaluation,
    arrivedForEvaluation,
    completeEvaluation,
    cancelEvaluationDonor,
  } = useHealthEvaluation();

  const { createFeedback } = useFeedback();
  const { user } = useAuthContext();
  const { secondUser } = useSecondAuth();
  const { reportUrl, generateHealthEvaluationReport, generateHealthEvaluationReportByHospital } = useGenerateReport();
  

  const userId = user?.userObj?._id;
  const Donor = user?.role === "Donor";
  const Hospital = user?.role === "Hospital";
  const Manager = user?.role === "Manager";
  const HospitalAdmin = secondUser?.role === "HospitalAdmin";
  const hospitalAdminId = secondUser?.userObj?._id;

  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [openArrivedModal, setOpenArrivedModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState("");
  const [subject, setSubject] = useState("");
  const [comments, setComments] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [starRating, setStarRating] = useState("");

  const [rescheduleErrors, setRescheduleErrors] = useState({});
  const [arrivedErrors, setArrivedErrors] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [feedbackErrors, setFeedbackErrors] = useState({});
  const [filter, setFilter] = useState({ date: "", progressStatus: "" });
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!userId) return;
    if (Donor) fetchEvaluationByDonorId(userId);
    else if (Hospital) fetchEvaluationByHospitalId(userId);
    else fetchEvaluations();
  }, [userId, Donor, Hospital, fetchEvaluationByDonorId, fetchEvaluationByHospitalId, fetchEvaluations]);

  useEffect(() => {
    const filtered = evaluations.filter((evaluation) => {
      if (evaluation.activeStatus === "Cancelled") return false;
      const dateMatch = filter.date
        ? new Date(evaluation.evaluationDate).toISOString().split("T")[0] === filter.date
        : true;
      const statusMatch = filter.progressStatus
        ? evaluation.progressStatus === filter.progressStatus
        : true;
      return dateMatch && statusMatch;
    });
    setFilteredEvaluations(filtered);
  }, [evaluations, filter]);

  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    setFilter((prev) => ({ ...prev, [id]: value }));
  };

  const validateRescheduleForm = () => {
    const errors = {};
    if (!newDate) errors.newDate = "Date is required";
    else if (new Date(newDate) < new Date()) errors.newDate = "Date cannot be in the past";
    if (!newTime) errors.newTime = "Time is required";
    setRescheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateArrivedForm = () => {
    const errors = {};
    if (!receiptNumber) errors.receiptNumber = "Receipt number is required";
    else if (!/^[A-Za-z0-9-]+$/.test(receiptNumber)) errors.receiptNumber = "Invalid receipt number";
    setArrivedErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateUploadForm = () => {
    const errors = {};
    if (!selectedFile) errors.selectedFile = "File is required";
    else if (!["image/jpeg", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(selectedFile.type)) {
      errors.selectedFile = "File must be JPG, PDF, DOCX, or XLSX";
    }
    if (!evaluationResult) errors.evaluationResult = "Result is required";
    setUploadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateFeedbackForm = () => {
    const errors = {};
    if (!subject) errors.subject = "Subject is required";
    if (!comments) errors.comments = "Comments are required";
    if (!feedbackType) errors.feedbackType = "Feedback type is required";
    if (starRating && (starRating < 1 || starRating > 5)) errors.starRating = "Rating must be 1-5";
    setFeedbackErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRescheduleClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setNewDate(evaluation.evaluationDate || "");
    setNewTime(evaluation.evaluationTime || "");
    setRescheduleErrors({});
    setOpenRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!validateRescheduleForm()) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await updateEvaluationDateTime(selectedEvaluation.id, newDate, newTime, hospitalAdminId);
      setOpenRescheduleModal(false);
    } catch (err) {
      setErrorMessage("Failed to reschedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleArrivedClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setReceiptNumber(evaluation.receiptNumber || "");
    setArrivedErrors({});
    setOpenArrivedModal(true);
  };

  const handleArrivedSubmit = async () => {
    if (!validateArrivedForm()) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await arrivedForEvaluation(selectedEvaluation.id, receiptNumber);
      setOpenArrivedModal(false);
    } catch (err) {
      setErrorMessage("Failed to confirm arrival.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setSelectedFile(null);
    setEvaluationResult("");
    setUploadErrors({});
    setOpenUploadModal(true);
  };

  const handleUploadSubmit = async () => {
    if (!validateUploadForm()) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await completeEvaluation(selectedEvaluation.id, evaluationResult, selectedFile);
      setOpenUploadModal(false);
      setSelectedFile(null);
      setEvaluationResult("");
    } catch (err) {
      setErrorMessage("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setSubject("");
    setComments("");
    setFeedbackType("");
    setStarRating("");
    setFeedbackErrors({});
    setOpenFeedbackModal(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!validateFeedbackForm()) return;
    const feedbackData = {
      donorId: userId,
      sessionId: selectedEvaluation.id,
      sessionModel: "HealthEvaluation",
      subject,
      comments,
      feedbackType,
      starRating,
    };
    setLoading(true);
    setErrorMessage("");
    try {
      await createFeedback(feedbackData);
      setOpenFeedbackModal(false);
    } catch (err) {
      setErrorMessage("Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsClick = (evaluation) => {
    setSelectedDonor(evaluation.donorId);
    setOpenDetailsModal(true);
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    if(Donor) generateHealthEvaluationReport(user.userObj._id);
    else if (Hospital) generateHealthEvaluationReportByHospital(user.userObj._id);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-red-700">Health Evaluations</h1>
          <div className="flex items-center space-x-4">
            <Button gradientDuoTone="redToPink" onClick={handleGenerateReport} disabled={loading}
            className="bg-red-500 text-white rounded-lg hover:bg-red-700 transition">
              Generate Report
            </Button>
            {reportUrl && (
              <div className="flex flex-col items-center">
                <p className="text-green-600 mb-2">Report generated!</p>
                <a
                  href={`http://localhost:3020${reportUrl}`}
                  download
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Filter Evaluations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label value="Date" />
              <TextInput
                id="date"
                type="date"
                value={filter.date}
                onChange={handleFilterChange}
                min={today}
              />
            </div>
            <div>
              <Label value="Progress Status" />
              <Select id="progressStatus" value={filter.progressStatus} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
              </Select>
            </div>
          </div>
        </div>

        {loading && <Spinner />}
        {errorMessage && <div className="text-red-600 text-center mt-4">{errorMessage}</div>}

        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Donor Name</Table.HeadCell>
            <Table.HeadCell>Date</Table.HeadCell>
            <Table.HeadCell>Progress Status</Table.HeadCell>
            <Table.HeadCell>Receipt No.</Table.HeadCell>
            <Table.HeadCell>Time</Table.HeadCell>
            <Table.HeadCell>Pass Status</Table.HeadCell>
            <Table.HeadCell>Hospital</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((evaluation) => (
                <Table.Row key={evaluation.id} className="bg-white">
                  <Table.Cell>{evaluation.donor ? `${evaluation.donor.firstName} ${evaluation.donor.lastName}` : "N/A"}</Table.Cell>
                  <Table.Cell>{new Date(evaluation.evaluationDate).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.progressStatus === "In Progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {evaluation.progressStatus}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{evaluation.receiptNumber || "N/A"}</Table.Cell>
                  <Table.Cell>{evaluation.evaluationTime || "N/A"}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.passStatus === "Passed"
                          ? "bg-green-100 text-green-700"
                          : evaluation.passStatus === "Failed"
                          ? "bg-red-100 text-red-700"
                          : evaluation.passStatus === "Cancelled"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {evaluation.passStatus}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{evaluation.hospital?.name || "N/A"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button size="xs" color="blue" onClick={() => handleDetailsClick(evaluation)}>
                        Details
                      </Button>
                      {Hospital && HospitalAdmin && (
                        <>
                          {evaluation.activeStatus !== "Cancelled" &&
                            evaluation.activeStatus !== "Re-Scheduled" &&
                            evaluation.activeStatus !== "Accepted" && (
                              <Button
                                size="xs"
                                color="warning"
                                onClick={() => handleRescheduleClick(evaluation)}
                              >
                                Reschedule
                              </Button>
                            )}
                          {evaluation.activeStatus !== "Cancelled" &&
                            evaluation.activeStatus !== "Accepted" && (
                              <Button
                                size="xs"
                                color="gray"
                                onClick={() => cancelEvaluation(evaluation.id, hospitalAdminId, evaluation.donorId)}
                              >
                                Cancel
                              </Button>
                            )}
                          {evaluation.activeStatus !== "Cancelled" &&
                            evaluation.activeStatus !== "Accepted" &&
                            evaluation.activeStatus !== "Re-Scheduled" && (
                              <Button
                                size="xs"
                                color="gray"
                                onClick={() => acceptEvaluation(evaluation.id, hospitalAdminId)}
                              >
                                Accept
                              </Button>
                            )}
                          {(evaluation.progressStatus === "Completed" ||
                            evaluation.activeStatus === "Cancelled") && (
                            <Button
                              size="xs"
                              color="failure"
                              onClick={() => deleteEvaluation(evaluation.id)}
                            >
                              Delete
                            </Button>
                          )}
                          {evaluation.progressStatus === "Not Started" &&
                            evaluation.activeStatus === "Accepted" && (
                              <Button
                                size="xs"
                                color="success"
                                onClick={() => handleArrivedClick(evaluation)}
                              >
                                Arrived
                              </Button>
                            )}
                          {evaluation.progressStatus === "In Progress" &&
                            evaluation.passStatus === "Pending" &&
                            evaluation.activeStatus === "Accepted" && (
                              <Button
                                size="xs"
                                color="lime"
                                onClick={() => handleUploadClick(evaluation)}
                              >
                                Upload
                              </Button>
                            )}
                        </>
                      )}
                      {Donor && (
                        <>
                          {evaluation.activeStatus === "Re-Scheduled" &&
                            evaluation.activeStatus !== "Cancelled" && (
                              <Button
                                size="xs"
                                color="gray"
                                onClick={() => cancelEvaluationDonor(evaluation.id, userId)}
                              >
                                Cancel
                              </Button>
                            )}
                          {evaluation.activeStatus !== "Cancelled" &&
                            evaluation.activeStatus !== "Accepted" &&
                            evaluation.activeStatus === "Re-Scheduled" && (
                              <Button
                                size="xs"
                                color="gray"
                                onClick={() => acceptEvaluation(evaluation.id, hospitalAdminId)}
                              >
                                Accept
                              </Button>
                            )}
                          {evaluation.progressStatus === "Completed" && (
                            <Button
                              size="xs"
                              color="gray"
                              onClick={() => handleFeedbackClick(evaluation)}
                            >
                              Feedback
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan="8" className="text-center py-4 text-gray-500">
                  No evaluations found
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        <Modal show={openRescheduleModal} onClose={() => setOpenRescheduleModal(false)}>
          <Modal.Header>Reschedule Evaluation</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label value="New Date" />
                <TextInput
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  color={rescheduleErrors.newDate ? "failure" : "gray"}
                />
                {rescheduleErrors.newDate && (
                  <p className="text-red-600 text-sm">{rescheduleErrors.newDate}</p>
                )}
              </div>
              <div>
                <Label value="New Time" />
                <TextInput
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  color={rescheduleErrors.newTime ? "failure" : "gray"}
                />
                {rescheduleErrors.newTime && (
                  <p className="text-red-600 text-sm">{rescheduleErrors.newTime}</p>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button gradientDuoTone="redToPink" onClick={handleRescheduleSubmit} disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : "Save"}
            </Button>
            <Button color="gray" onClick={() => setOpenRescheduleModal(false)} disabled={loading}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openArrivedModal} onClose={() => setOpenArrivedModal(false)}>
          <Modal.Header>Confirm Arrival</Modal.Header>
          <Modal.Body>
            <div>
              <Label value="Receipt Number" />
              <TextInput
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
                color={arrivedErrors.receiptNumber ? "failure" : "gray"}
              />
              {arrivedErrors.receiptNumber && (
                <p className="text-red-600 text-sm">{arrivedErrors.receiptNumber}</p>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button gradientDuoTone="redToPink" onClick={handleArrivedSubmit} disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : "Confirm"}
            </Button>
            <Button color="gray" onClick={() => setOpenArrivedModal(false)} disabled={loading}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openUploadModal} onClose={() => setOpenUploadModal(false)}>
          <Modal.Header>Upload Evaluation File</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label value="Select File" />
                <FileInput
                  accept=".jpg,.pdf,.docx,.xlsx"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required
                  color={uploadErrors.selectedFile ? "failure" : "gray"}
                />
                {uploadErrors.selectedFile && (
                  <p className="text-red-600 text-sm">{uploadErrors.selectedFile}</p>
                )}
              </div>
              <div>
                <Label value="Evaluation Result" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="evaluationResult"
                      value="Passed"
                      onChange={(e) => setEvaluationResult(e.target.value)}
                      checked={evaluationResult === "Passed"}
                    />
                    Pass
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="evaluationResult"
                      value="Failed"
                      onChange={(e) => setEvaluationResult(e.target.value)}
                      checked={evaluationResult === "Failed"}
                    />
                    Fail
                  </label>
                </div>
                {uploadErrors.evaluationResult && (
                  <p className="text-red-600 text-sm">{uploadErrors.evaluationResult}</p>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button gradientDuoTone="redToPink" onClick={handleUploadSubmit} disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : "Upload"}
            </Button>
            <Button color="gray" onClick={() => setOpenUploadModal(false)} disabled={loading}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openFeedbackModal} onClose={() => setOpenFeedbackModal(false)}>
          <Modal.Header>Submit Feedback</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label value="Subject" />
                <TextInput
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  color={feedbackErrors.subject ? "failure" : "gray"}
                />
                {feedbackErrors.subject && (
                  <p className="text-red-600 text-sm">{feedbackErrors.subject}</p>
                )}
              </div>
              <div>
                <Label value="Comments" />
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required
                  color={feedbackErrors.comments ? "failure" : "gray"}
                />
                {feedbackErrors.comments && (
                  <p className="text-red-600 text-sm">{feedbackErrors.comments}</p>
                )}
              </div>
              <div>
                <Label value="Feedback Type" />
                <Select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  required
                  color={feedbackErrors.feedbackType ? "failure" : "gray"}
                >
                  <option value="">Select Type</option>
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Complaint">Complaint</option>
                </Select>
                {feedbackErrors.feedbackType && (
                  <p className="text-red-600 text-sm">{feedbackErrors.feedbackType}</p>
                )}
              </div>
              <div>
                <Label value="Star Rating (Optional)" />
                <TextInput
                  type="number"
                  min="1"
                  max="5"
                  value={starRating}
                  onChange={(e) => setStarRating(e.target.value)}
                  color={feedbackErrors.starRating ? "failure" : "gray"}
                />
                {feedbackErrors.starRating && (
                  <p className="text-red-600 text-sm">{feedbackErrors.starRating}</p>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button gradientDuoTone="redToPink" onClick={handleFeedbackSubmit} disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : "Submit"}
            </Button>
            <Button color="gray" onClick={() => setOpenFeedbackModal(false)} disabled={loading}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openDetailsModal} onClose={() => setOpenDetailsModal(false)} size="lg">
          <Modal.Header>Donor Details</Modal.Header>
          <Modal.Body className="p-6">
            {selectedDonor ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">First Name</p>
                    <p className="text-base text-gray-900">{selectedDonor.firstName || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Last Name</p>
                    <p className="text-base text-gray-900">{selectedDonor.lastName || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Gender</p>
                    <p className="text-base text-gray-900">{selectedDonor.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Date of Birth</p>
                    <p className="text-base text-gray-900">
                      {selectedDonor.dob ? new Date(selectedDonor.dob).toLocaleDateString("en-US") : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Phone Number</p>
                    <p className="text-base text-gray-900">{selectedDonor.phoneNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Email</p>
                    <p className="text-base text-gray-900">{selectedDonor.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">City</p>
                    <p className="text-base text-gray-900">{selectedDonor.city || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">NIC</p>
                    <p className="text-base text-gray-900">{selectedDonor.nic || "N/A"}</p>
                  </div>
                </div>
                <hr className="border-gray-200" />
                <h3 className="text-lg font-semibold text-gray-900">Donor Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Active Status</p>
                    <p className="text-base text-gray-900">{selectedDonor.activeStatus ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Health Status</p>
                    <p className="text-base text-gray-900">{selectedDonor.healthStatus ? "Healthy" : "Not Healthy"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Appointment Status</p>
                    <p className="text-base text-gray-900">
                      {selectedDonor.appointmentStatus ? "Scheduled" : "Not Scheduled"}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-bold text-red-700">Registered On</p>
                    <p className="text-base text-gray-900">
                      {selectedDonor.createdAt ? new Date(selectedDonor.createdAt).toLocaleDateString("en-US") : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <p className="text-sm font-bold text-red-700">Blood Type</p>
                  <p className="text-base text-gray-900">{selectedDonor.bloodType || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No donor selected</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button color="gray" onClick={() => setOpenDetailsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}