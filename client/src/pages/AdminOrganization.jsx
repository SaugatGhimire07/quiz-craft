import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import ConfirmationOverlay from "../components/ConfirmationOverlay";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../styles/userdashboard.css";
import "../styles/adminorganization.css"; // New CSS file for additional styles

const AdminOrganization = () => {
  const { user, isAdmin } = useAuth();
  const [initials, setInitials] = useState("");
  const [name, setName] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [people, setPeople] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showModifyOrg, setShowModifyOrg] = useState(false);
  const [showCreatePerson, setShowCreatePerson] = useState(false);
  const [showModifyPerson, setShowModifyPerson] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

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

  const fetchPeople = async (orgId) => {
    try {
      const response = await api.get(`/organization/${orgId}/people`);
      setPeople(response.data);
    } catch (error) {
      console.error("Error fetching people:", error);
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

  const handleCreateNewOrg = () => {
    setShowCreateOrg(true);
    setShowModifyOrg(false);
    setShowCreatePerson(false);
    setShowModifyPerson(false);
  };

  const handleModifyOrg = (orgId) => {
    setSelectedOrg(orgId);
    setShowCreateOrg(false);
    setShowModifyOrg(true);
    setShowCreatePerson(false);
    setShowModifyPerson(false);
  };

  const handleSelectOrg = (orgId) => {
    setSelectedOrg(orgId);
    fetchPeople(orgId);
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(false);
    setShowModifyPerson(false);
  };

  const handleCreatePerson = () => {
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(true);
    setShowModifyPerson(false);
  };

  const handleModifyPerson = (person) => {
    setCurrentPerson(person);
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(false);
    setShowModifyPerson(true);
  };

  const confirmDeletePerson = (e, person) => {
    e.stopPropagation();
    setPersonToDelete(person);
    setShowDeleteConfirmation(true);
    setActiveDropdown(null);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;

    try {
      await api.delete(`/person/${personToDelete._id}`);
      setPeople(people.filter((person) => person._id !== personToDelete._id));
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting person:", error);
    }
  };

  const toggleDropdown = (orgId) => {
    if (activeDropdown === orgId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(orgId);
      handleSelectOrg(orgId);
    }
  };

  const CreateOrganization = () => {
    const [orgName, setOrgName] = useState("");

    const handleCreateOrg = async () => {
      try {
        await api.post("/organization", { name: orgName });
        fetchOrganizations();
        setShowCreateOrg(false);
      } catch (error) {
        console.error("Error creating organization:", error);
      }
    };

    const handleCancel = () => {
      setShowCreateOrg(false);
    };

    return (
      <div className="create-org-container">
        <h2>Create Organization</h2>
        <div className="form-group">
          <label htmlFor="orgName">Organization Name</label>
          <input
            type="text"
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <button onClick={handleCreateOrg}>Create</button>
        <button className="cancel" onClick={handleCancel}>Cancel</button>
      </div>
    );
  };

  const ModifyOrganization = () => {
    const [orgName, setOrgName] = useState("");

    useEffect(() => {
      const fetchOrg = async () => {
        try {
          const response = await api.get(`/organization/${selectedOrg}`);
          setOrgName(response.data.name);
        } catch (error) {
          console.error("Error fetching organization:", error);
        }
      };

      fetchOrg();
    }, [selectedOrg]);

    const handleModifyOrg = async () => {
      try {
        await api.put(`/organization/${selectedOrg}`, { name: orgName });
        fetchOrganizations();
        setShowModifyOrg(false);
      } catch (error) {
        console.error("Error modifying organization:", error);
      }
    };

    return (
      <div className="modify-org-container">
        <h2>Modify Organization</h2>
        <div className="form-group">
          <label htmlFor="orgName">Organization Name</label>
          <input
            type="text"
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <button onClick={handleModifyOrg}>Save</button>
        <button className="cancel" onClick={() => setShowModifyOrg(false)}>Cancel</button>
      </div>
    );
  };

  const CreatePerson = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleCreatePerson = async () => {
      try {
        await api.post(`/organization/${selectedOrg}/people`, { name, email });
        fetchPeople(selectedOrg);
        setShowCreatePerson(false);
      } catch (error) {
        console.error("Error creating person:", error);
      }
    };

    const handleCancel = () => {
      setShowCreatePerson(false);
    };

    return (
      <div className="create-person-container">
        <h2>Create Person</h2>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button onClick={handleCreatePerson}>Create</button>
        <button className="cancel" onClick={handleCancel}>Cancel</button>
      </div>
    );
  };

  const ModifyPerson = () => {
    const [name, setName] = useState(currentPerson.name);
    const [email, setEmail] = useState(currentPerson.email);

    const handleModifyPerson = async () => {
      try {
        await api.put(`/person/${currentPerson._id}`, { name, email });
        fetchPeople(selectedOrg);
        setShowModifyPerson(false);
      } catch (error) {
        console.error("Error modifying person:", error);
      }
    };

    return (
      <div className="modify-person-container">
        <h2>Modify Person</h2>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button onClick={handleModifyPerson}>Save</button>
        <button className="cancel" onClick={() => setShowModifyPerson(false)}>Cancel</button>
      </div>
    );
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
                Create Organization
              </button>
            </div>
            <h2 className="sub-heading-title">All Organizations</h2>
            <table className="organization-table">
              <thead>
                <tr className="organization-table-row">
                  <th className="organization-table-header">Organization Name</th>
                  <th className="organization-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="organization-table-row">
                    <td className="organization-table-data" colSpan="2">Loading organizations...</td>
                  </tr>
                ) : organizations.length > 0 ? (
                  organizations.map((org) => (
                    <React.Fragment key={org._id}>
                      <tr className="organization-table-row">
                        <td className="organization-table-data" onClick={() => toggleDropdown(org._id)}>
                          {org.name}
                          <button className="dropdown-arrow">
                            {activeDropdown === org._id ? "▲" : "▼"}
                          </button>
                        </td>
                        <td className="organization-table-data">
                          <button className="action-button" onClick={() => handleModifyOrg(org._id)}>
                            <i className="fas fa-edit"></i> Modify
                          </button>
                          <button className="action-button" onClick={() => handleCreatePerson()}>
                            <i className="fas fa-user-plus"></i> Add Person
                          </button>
                        </td>
                      </tr>
                      {activeDropdown === org._id && (
                        <tr className="organization-table-row">
                          <td className="organization-table-data" colSpan="2">
                            <table className="people-table">
                              <thead>
                                <tr className="people-table-row">
                                  <th className="people-table-header">Name</th>
                                  <th className="people-table-header">Email</th>
                                  <th className="people-table-header">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {people.length > 0 ? (
                                  people.map((person) => (
                                    <tr className="people-table-row" key={person._id}>
                                      <td className="people-table-data">{person.name}</td>
                                      <td className="people-table-data">{person.email}</td>
                                      <td className="people-table-data">
                                        <button className="action-button" onClick={() => handleModifyPerson(person)}>
                                          <i className="fas fa-edit"></i> Modify
                                        </button>
                                        <button className="action-button" onClick={(e) => confirmDeletePerson(e, person)}>
                                          <i className="fas fa-trash"></i> Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="people-table-row">
                                    <td className="people-table-data" colSpan="3">No people found in this organization.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr className="organization-table-row">
                    <td className="organization-table-data" colSpan="2">No organizations found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {showCreateOrg && <CreateOrganization />}
            {showModifyOrg && <ModifyOrganization />}
            {showCreatePerson && <CreatePerson />}
            {showModifyPerson && <ModifyPerson />}
          </div>
        </div>
      </div>

      <ConfirmationOverlay
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeletePerson}
        title="Delete Person"
        message={
          <>
            Are you sure you want to delete "{personToDelete?.name}"?
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