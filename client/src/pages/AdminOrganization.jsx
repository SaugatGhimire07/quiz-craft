import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import ConfirmationOverlay from "../components/ConfirmationOverlay";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../styles/userdashboard.css";
import "../styles/adminorganization.css";

const AdminOrganization = () => {
  const { user, isAdmin } = useAuth();
  const [initials, setInitials] = useState("");
  const [name, setName] = useState("");
  const [orgID, setOrgID] = useState(null);
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
  const [showImportPerson, setShowImportPerson] = useState(false);
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
    console.log("Fetching people for organization ID:", orgId); // Log orgId

    try {
      const response = await api.get(`/organization/${orgId}/people`);
      console.log("Fetched people:", response.data); // Log the fetched people
      setPeople(response.data);
    } catch (error) {
      console.error("Error fetching people:", error);

      // Log the error response for debugging
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        console.log("Error response headers:", error.response.headers);
      }
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
    setShowImportPerson(false);
  };

  const handleModifyOrg = (orgId) => {
    setSelectedOrg(orgId);
    setShowCreateOrg(false);
    setShowModifyOrg(true);
    setShowCreatePerson(false);
    setShowModifyPerson(false);
    setShowImportPerson(false);
  };

  const handleSelectOrg = (orgId) => {
    setSelectedOrg(orgId);
    fetchPeople(orgId);
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(false);
    setShowModifyPerson(false);
    setShowImportPerson(false);
  };

  const handleCreatePerson = (orgId) => {
    setSelectedOrg(orgId); // Automatically select the organization
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(true);
    setShowModifyPerson(false);
    setShowImportPerson(false);
  };

  const handleModifyPerson = (person) => {
    setCurrentPerson(person);
    setShowCreateOrg(false);
    setShowModifyOrg(false);
    setShowCreatePerson(false);
    setShowModifyPerson(true);
    setShowImportPerson(false);
  };

  const confirmDeletePerson = (e, person) => {
    e.stopPropagation();
    setPersonToDelete(person);
    setShowDeleteConfirmation(true);
    setActiveDropdown(null);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) {
      console.log("No person selected for deletion."); // Log if no person is selected
      return;
    }

    console.log("Deleting person with ID:", personToDelete._id); // Log person ID

    try {
      const response = await api.delete(`/person/${personToDelete._id}`);
      console.log("Delete person response:", response.data); // Log the response
      setPeople(people.filter((person) => person._id !== personToDelete._id));
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting person:", error);

      // Log the error response for debugging
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        console.log("Error response headers:", error.response.headers);
      }
    }
  };

  const toggleDropdown = (orgId) => {
    if (activeDropdown === orgId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(orgId);
      setSelectedOrg(orgId); // Ensure selectedOrg is set
      handleSelectOrg(orgId);
    }
  };

  const ImportPeople = ({ orgId, onClose, onImport }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(""); // State for error message
  
    const handleFileChange = (e) => {
      setFile(e.target.files[0]);
    };
  
    const handleSubmit = async () => {
      if (!file) {
        setError("Please select a file to upload.");
        return;
      }
  
      if (!orgId) {
        setError("Organization ID is missing. Please select an organization.");
        return;
      }
  
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const response = await api.post(`/organization/${orgId}/import-people`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        onImport(response.data);
        onClose();
        setError(""); // Clear error message on success
      } catch (error) {
        console.error("Error importing people:", error);
  
        // Display backend validation errors
        if (error.response && error.response.data && error.response.data.errors) {
          const errorMessages = error.response.data.errors.map((err) => err.error).join("\n");
          setError(errorMessages); // Show backend error messages
        } else if (error.response && error.response.data && error.response.data.error) {
          setError(error.response.data.error); // Show backend error message
        } else {
          setError("Failed to import people. Please try again.");
        }
      }
    };
  
    return (
      <div className="import-people-container">
        <h2>Import People</h2>
        {error && <div className="error-message">{error}</div>} {/* Display error message */}
        <div className="form-group">
          <label htmlFor="file">Select Excel File</label>
          <input
            type="file"
            id="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>
        <button onClick={handleSubmit}>Import</button>
        <button className="cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    );
  };

  const CreateOrganization = () => {
    const [orgName, setOrgName] = useState("");
    const [error, setError] = useState(""); // State for error message

    const handleCreateOrg = async () => {
      // Frontend validation
      if (!orgName || orgName.trim() === "") {
        setError("Organization name is required.");
        return;
      }
  
      if (orgName.length < 3 || orgName.length > 50) {
        setError("Organization name must be between 3 and 50 characters.");
        return;
      }
  
      try {
        await api.post("/organization", { name: orgName });
        fetchOrganizations();
        setShowCreateOrg(false);
        setError(""); // Clear error message on success
      } catch (error) {
        console.error("Error creating organization:", error);
  
        // Display backend validation errors
        if (error.response && error.response.data && error.response.data.error) {
          setError(error.response.data.error); // Show backend error message
        } else {
          setError("Failed to create organization. Please try again.");
        }
      }
    };

    const handleCancel = () => {
      setShowCreateOrg(false);
      setError(""); // Clear error message on cancel
    };

    return (
      <div className="create-org-container">
        <h2>Create Organization</h2>
        {error && <div className="error-message">{error}</div>} {/* Display error message */}
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
        <button className="cancel" onClick={handleCancel}>
          Cancel
        </button>
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
        <button className="cancel" onClick={() => setShowModifyOrg(false)}>
          Cancel
        </button>
      </div>
    );
  };

  const handleDeleteOrg = async (orgId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this organization? All people under this organization will also be permanently deleted. This action cannot be undone."
      )
    ) {
      return;
    }
  
    try {
      const response = await api.delete(`/organization/${orgId}`);
      console.log("Delete organization response:", response.data);
  
      // Remove the deleted organization from the state
      setOrganizations(organizations.filter((org) => org.orgId !== orgId));
      setPeople([]); // Clear the people list if the selected organization is deleted
      alert("Organization and all associated people deleted successfully.");
    } catch (error) {
      console.error("Error deleting organization:", error);
  
      // Display backend error message
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Failed to delete organization. Please try again.");
      }
    }
  };

  const CreatePerson = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState(""); // State for error message

    const handleCreatePerson = async () => {
      if (!selectedOrg) {
        alert("No organization selected. Please select an organization first.");
        return;
      }

      if (!name || !email) {
        setError("Name and email are required.");
        return;
      }

      try {
        const response = await api.post(`/organization/${selectedOrg}/people`, { name, email });
        fetchPeople(selectedOrg);
        setShowCreatePerson(false);
        setError(""); // Clear error message on success
      } catch (error) {
        console.error("Error creating person:", error);

        // Display backend validation errors
        if (error.response && error.response.data && error.response.data.error) {
          setError(error.response.data.error); // Show backend error message
        } else {
          setError("Failed to create person. Please try again.");
        }
      }
    };

    const handleCancel = () => {
      setShowCreatePerson(false);
      setError(""); // Clear error message on cancel
    };

    return (
      <div className="create-person-container">
        <h2>Create Person</h2>
        {error && <div className="error-message">{error}</div>} {/* Display error message */}
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
        <button className="cancel" onClick={handleCancel}>
          Cancel
        </button>
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
        <button className="cancel" onClick={() => setShowModifyPerson(false)}>
          Cancel
        </button>
      </div>
    );
  };

  const PeopleTable = ({ people }) => {
    return (
      <table className="people-table">
        <thead>
          <tr className="people-table-header-row">
            <th className="people-table-header-data">Name</th>
            <th className="people-table-header-data">Email</th>
            <th className="people-table-header-data">Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.length > 0 ? (
            people.map((person) => (
              <tr className="people-table-data-row" key={person._id}>
                <td className="people-table-data-name">{person.name}</td>
                <td className="people-table-data-email">{person.email}</td>
                <td className="people-table-data-actions">
                  <div className="action-buttons-container">
                    <button
                      className="action-button modify"
                      onClick={() => handleModifyPerson(person)}
                    >
                      Modify
                    </button>
                    <button
                      className="action-button delete"
                      onClick={(e) => confirmDeletePerson(e, person)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="people-table-empty-row">
              <td className="people-table-empty-data" colSpan="3">
                No people found in this organization.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="dashboard-container">
      <DashNav initials={initials} />

      <div className="content-container">
        <div className="main-content">
          <SidebarNav
            active="organization"
            showBackButton={false}
            isAdmin={user?.isAdmin}
          />

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
                <tr className="organization-table-header-row">
                  <th className="organization-table-header-data">Organization Name</th>
                  <th className="organization-table-header-data">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="organization-table-loading-row">
                    <td className="organization-table-loading-data" colSpan="2">
                      Loading organizations...
                    </td>
                  </tr>
                ) : organizations.length > 0 ? (
                  organizations.map((org) => (
                    <React.Fragment key={org.orgId || org._id}>
                      <tr className="organization-table-data-row">
                        <td
                          className="organization-table-data-name"
                          onClick={() => toggleDropdown(org.orgId)}
                        >
                          {org.name}
                          <button className="dropdown-arrow">
                            {activeDropdown === org.orgId ? "▲" : "▼"}
                          </button>
                        </td>
                        <td className="organization-table-data-actions">
                          <div className="action-buttons-container">
                            <button
                              className="action-button modify"
                              onClick={() => handleModifyOrg(org.orgId)}
                            >
                              Modify
                            </button>
                            <button
                              className="action-button add-person"
                              onClick={() => handleCreatePerson(org.orgId)} 
                            >
                              Add Person
                            </button>
                            <button
                              className="action-button import"
                              onClick={() => {
                                if (!org.orgId) {
                                  alert("Please select an organization first.");
                                  return;
                                }
                                setSelectedOrg(org.orgId);
                                setShowImportPerson(true);
                              }}
                            >
                              Import People
                            </button>
                            <button
                              className="action-button delete"
                              onClick={() => handleDeleteOrg(org.orgId)} // Call delete function
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {activeDropdown === org.orgId && (
                        <tr className="organization-table-people-row">
                          <td className="organization-table-people-data" colSpan="2">
                            <PeopleTable people={people} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr className="organization-table-empty-row">
                    <td className="organization-table-empty-data" colSpan="2">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {showCreateOrg && <CreateOrganization />}
            {showModifyOrg && <ModifyOrganization />}
            {showCreatePerson && <CreatePerson />}
            {showModifyPerson && <ModifyPerson />}
            {showImportPerson && (
              <ImportPeople
                orgId={selectedOrg}
                onClose={() => setShowImportPerson(false)}
                onImport={(importedPeople) => {
                  setPeople([...people, ...importedPeople]);
                  setShowImportPerson(false);
                }}
              />
            )}
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
