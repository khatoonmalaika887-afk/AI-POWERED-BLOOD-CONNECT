import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Spinner, Modal } from "flowbite-react";
import { FaPlus, FaEye, FaHistory, FaBell } from "react-icons/fa";
import { useReceiver } from "../hooks/receiver";
import { useBloodRequest } from "../hooks/bloodRequest";
import { toast } from "react-toastify";

export default function ReceiverDashboard() {
  const { user, getReceiverProfile } = useReceiver();
  const { getBloodRequestsByReceiver, createBloodRequest } = useBloodRequest();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    bloodType: "",
    unitsRequired: "",
    urgency: "Normal",
    city: "",
    notes: ""
  });

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const urgencies = ["Low", "Normal", "High", "Critical"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await getReceiverProfile();
      const userRequests = await getBloodRequestsByReceiver(user?.userObj?._id);
      setRequests(userRequests);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      await createBloodRequest({ ...newRequest, receiverId: user?.userObj?._id });
      toast.success("Blood request created successfully!");
      setShowCreateModal(false);
      setNewRequest({
        bloodType: "",
        unitsRequired: "",
        urgency: "Normal",
        city: "",
        notes: ""
      });
      loadData();
    } catch (error) {
      toast.error("Failed to create blood request");
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Low": return "gray";
      case "Normal": return "blue";
      case "High": return "yellow";
      case "Critical": return "red";
      default: return "gray";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "yellow";
      case "Approved": return "green";
      case "Rejected": return "red";
      case "Completed": return "blue";
      default: return "gray";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-400 to-red-600 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Receiver Dashboard</h1>
          <p className="text-red-100">Manage your blood requests and find donors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white bg-opacity-95 border-red-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-600">{requests.length}</h3>
              <p className="text-gray-600">Total Requests</p>
            </div>
          </Card>
          <Card className="bg-white bg-opacity-95 border-red-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === "Approved").length}
              </h3>
              <p className="text-gray-600">Approved</p>
            </div>
          </Card>
          <Card className="bg-white bg-opacity-95 border-red-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === "Pending").length}
              </h3>
              <p className="text-gray-600">Pending</p>
            </div>
          </Card>
          <Card className="bg-white bg-opacity-95 border-red-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === "Completed").length}
              </h3>
              <p className="text-gray-600">Completed</p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Button
            onClick={() => setShowCreateModal(true)}
            gradientDuoTone="redToPink"
            size="lg"
            className="bg-gradient-to-r from-red-500 to-pink-500"
          >
            <FaPlus className="mr-2" />
            Create Blood Request
          </Button>
        </div>

        {/* Blood Requests */}
        <Card className="bg-white bg-opacity-95 border-red-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Blood Requests</h2>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No blood requests found</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                gradientDuoTone="redToPink"
                className="mt-4"
              >
                Create Your First Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {request.bloodType} - {request.unitsRequired} units
                        </h3>
                        <Badge color={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                        <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{request.city}</p>
                      {request.notes && <p className="text-gray-500 text-sm">{request.notes}</p>}
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" color="gray">
                        <FaEye className="mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Create Request Modal */}
        <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <Modal.Header>Create Blood Request</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                <select
                  value={newRequest.bloodType}
                  onChange={(e) => setNewRequest({...newRequest, bloodType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select Blood Type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units Required</label>
                <input
                  type="number"
                  value={newRequest.unitsRequired}
                  onChange={(e) => setNewRequest({...newRequest, unitsRequired: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter units needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  {urgencies.map(urgency => (
                    <option key={urgency} value={urgency}>{urgency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={newRequest.city}
                  onChange={(e) => setNewRequest({...newRequest, city: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleCreateRequest} gradientDuoTone="redToPink">
              Create Request
            </Button>
            <Button color="gray" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
