import React, { useState, useEffect } from 'react';
import { 
  HiChartPie, HiUser, HiHeart, 
  HiMenu, HiX, HiChat, 
  HiQuestionMarkCircle, HiDocumentText, HiHome, HiMail, 
  HiOfficeBuilding, HiClock, HiClipboardCheck, HiExclamation
} from 'react-icons/hi';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout';
import Logo from '../assets/logo.svg';
import { Link } from 'react-router-dom';

// Export both as default and named export
const DashboardSidebar = () => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const Donor = user?.role === 'Donor';
  const Hospital = user?.role === 'Hospital';
  const Manager = user?.role === 'Manager';
  const HospitalAdmin = user?.role === 'HospitalAdmin';
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile !== isMobile) {
        setSidebarOpen(!mobile);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const NavItem = ({ to, icon: Icon, children, active }) => (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-3 text-gray-100 hover:bg-gray-700 transition-colors ${active ? 'bg-gray-700' : ''}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span>{children}</span>
    </Link>
  );

  return (
    <div className="relative">
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-red-600 text-white rounded-md"
        >
          {sidebarOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      )}
      
      <div className={`${isMobile ? (sidebarOpen ? 'block' : 'hidden') : 'block'} fixed md:static w-64 h-screen bg-gray-900 z-40`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center py-5 border-b border-gray-700">
            <img src={Logo} alt="Blood Connect Logo" className="w-8 h-8 mr-2" />
            <span className="text-white text-xl font-semibold">Blood Connect</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            <NavItem to="/dashboard" icon={HiHome} active={true}>Dashboard</NavItem>
            
            {/* Common navigation items for all users */}
            <NavItem to="/" icon={HiHome}>Home</NavItem>
            <NavItem to="/donor-login" icon={HiUser}>Donor Portal</NavItem>
            <NavItem to="/receiver-login" icon={HiUser}>Receiver Portal</NavItem>
            <NavItem to="/hospital-login" icon={HiOfficeBuilding}>Hospital Portal</NavItem>
            <NavItem to="/EBR" icon={HiExclamation}>Emergency Blood Request</NavItem>
            <NavItem to="/campaigns" icon={HiChartPie}>Campaigns</NavItem>
            <NavItem to="/chatbot" icon={HiChat}>Chatbot</NavItem>
            <NavItem to="/contactus" icon={HiMail}>Contact Us</NavItem>
            <NavItem to="/donate" icon={HiHeart}>Donate</NavItem>
            <NavItem to="/language" icon={HiChartPie}>Language</NavItem>
            
            {/* Donor specific navigation */}
            {user && Donor && (
              <>
                <NavItem to="/appointmentd" icon={HiClock}>Appointments</NavItem>
                <NavItem to="/healthEvaluationD" icon={HiClipboardCheck}>Health Evaluation</NavItem>
                <NavItem to="/emerbd" icon={HiExclamation}>Emergency Requests</NavItem>
                <NavItem to="/donorHistory" icon={HiDocumentText}>Donation History</NavItem>
                <NavItem to="/donorGamification" icon={HiHeart}>Gamification</NavItem>
                <NavItem to="/profile" icon={HiUser}>Profile</NavItem>
              </>
            )}
            
            {/* Hospital specific navigation */}
            {user && Hospital && (
              <>
                <NavItem to="/appointmentd" icon={HiClock}>Appointments</NavItem>
                <NavItem to="/healthEvaluationD" icon={HiClipboardCheck}>Health Evaluation</NavItem>
                <NavItem to="/emerbd" icon={HiExclamation}>Emergency Requests</NavItem>
                <NavItem to="/bloodid" icon={HiHeart}>Blood Inventory</NavItem>
                <NavItem to="/hosadd" icon={HiUser}>Hospital Admins</NavItem>
              </>
            )}
            
            {user && HospitalAdmin && (
              <>
                <NavItem to="/appointmentd" icon={HiClock}>Appointments</NavItem>
                <NavItem to="/healthEvaluationD" icon={HiClipboardCheck}>Health Evaluation</NavItem>
                <NavItem to="/emerbd" icon={HiExclamation}>Emergency Requests</NavItem>
                <NavItem to="/bloodid" icon={HiHeart}>Blood Inventory</NavItem>
                <NavItem to="/hospitalAdminProfile" icon={HiUser}>Profile</NavItem>
              </>
            )}
            
{user && Manager && (
              <>
                <NavItem to="/donord" icon={HiUser}>Donors</NavItem>
                <NavItem to="/receiverd" icon={HiUser}>Receivers</NavItem>
                <NavItem to="/hospitald" icon={HiOfficeBuilding}>Hospitals</NavItem>
                <NavItem to="/feedd" icon={HiDocumentText}>Feedbacks</NavItem>
                <NavItem to="/inqd" icon={HiQuestionMarkCircle}>Inquiries</NavItem>
                <NavItem to="/sysmand" icon={HiUser}>System Managers</NavItem>
                <NavItem to="/bloodid" icon={HiHeart}>Blood Inventory</NavItem>
                <NavItem to="/emerbd" icon={HiExclamation}>Emergency Requests</NavItem>
                <NavItem to="/backup" icon={HiDocumentText}>Backups</NavItem>
                <NavItem to="/reports" icon={HiDocumentText}>Reports</NavItem>
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="flex items-center w-full text-left text-gray-400 hover:text-white"
            >
              <HiHome className="w-5 h-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DashboardSidebar };
export default DashboardSidebar;