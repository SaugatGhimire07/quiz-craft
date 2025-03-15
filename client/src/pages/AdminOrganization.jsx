import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import ConfirmationOverlay from "../components/ConfirmationOverlay";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../styles/userdashboard.css";

const AdminOrganization = () => {
    const { user, isAdmin } = useAuth();
    const [initials, setInitials] = useState("");
    const [name, setName] = useState("");
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState(null);

    const fetchOrganizations = async () => {
        try {
            const response = await api.get("/organization/all");
            setOrganizations(response.data);
        } catch (error) {
            console.error("Error fetching organizations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const userName = user.name || "";
            setName(userName);
            const userInitials = userName
                ? userName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                : "";
            setInitials(userInitials);

            fetchOrganizations();
        }
    }, [user, isAdmin]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown !== null && !event.target.closest(".org-dropdown")) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeDropdown]);

    const handleCreateNewOrg = () => {
        navigate("/create-organization");
    };

    const handleModifyOrg = (orgId) => {
        navigate(`/modify-organization/${orgId}`);
    };

    const toggleDropdown = (e, index) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === index ? null : index);
    };

    const confirmDelete = (e, org) => {
        e.stopPropagation();
        setOrgToDelete(org);
        setShowDeleteConfirmation(true);
        setActiveDropdown(null);
    };

    const handleDeleteOrg = async () => {
        if (!orgToDelete) return;

        try {
            await api.delete(`/organization/${orgToDelete._id}`);
            setOrganizations(organizations.filter((org) => org._id !== orgToDelete._id));
        } catch (error) {
            console.error("Error deleting organization:", error);
        }
    };

    return (
        <div className="dashboard-container">   
            <DashNav initials={initials} />

            <div className="content-container">
                <div className="main-content">
                    <SidebarNav active="organization" showBackButton={false} isAdmin={user?.isAdmin} />
                    

                    <div className="dashboard-content">
                        <h1 className="dashboard-title">Organization</h1>

                        <div className="top-section">
                            <button className="dropdown-button" onClick={handleCreateNewOrg}>
                                Create New Organization
                                <span className="dropdown-icon">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </span>
                            </button>
                        </div>

                        <h2 className="sub-heading-title">All Organizations</h2>

                        <div className="quizzes-grid">
                            {loading ? (
                                <div>Loading organizations...</div>
                            ) : organizations.length > 0 ? (
                                organizations.map((org, index) => (
                                    <div key={org._id} className="quiz-card">
                                        <div className="quiz-info">
                                            <div className="avatar">{org.name.substring(0, 2).toUpperCase()}</div>
                                            <div className="quiz-details">
                                                <h3>{org.name}</h3>
                                                <p>Created {new Date(org.createdAt).toLocaleDateString()}</p>
                                            </div>

                                            <div className="quiz-dropdown">
                                                <button className="modify-button" onClick={() => handleModifyOrg(org._id)}>
                                                    Modify
                                                </button>
                                                <button
                                                    className="ellipsis-button"
                                                    onClick={(e) => toggleDropdown(e, index)}
                                                    aria-label="Organization options"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <circle cx="12" cy="12" r="1"></circle>
                                                        <circle cx="12" cy="5" r="1"></circle>
                                                        <circle cx="12" cy="19" r="1"></circle>
                                                    </svg>
                                                </button>

                                                {activeDropdown === index && (
                                                    <div className="quiz-dropdown-menu">
                                                        <button
                                                            onClick={(e) => confirmDelete(e, org)}
                                                            className="dropdown-item delete-item"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M3 6h18"></path>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                            Delete Organization
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (   
                                <div className="no-quizzes">
                                    <p>No organizations found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationOverlay
                isOpen={showDeleteConfirmation}
                onClose={() => setShowDeleteConfirmation(false)}
                onConfirm={handleDeleteOrg}
                title="Delete Organization"
                message={
                    <>
                        Are you sure you want to delete "{orgToDelete?.name}"?
                        <br />
                        <span className="text-danger">This action cannot be undone.</span>
                    </>
                }
                type="danger"
            />
        </div>
    );
};

export default AdminOrganization;