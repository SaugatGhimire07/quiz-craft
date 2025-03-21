import express from "express";
import {
  createOrganization,
  getAllOrganizations,
  getPeopleInOrganization,
  addPersonToOrganization,
  updatePerson,
  deletePerson,
  importPeopleToOrganization,
  deleteOrganization, // Import the deleteOrganization controller
} from "../controllers/organizationController.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer with file validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Excel files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

const router = express.Router();

// Organization management routes
router.post("/organization", createOrganization);
router.get("/organization/all", getAllOrganizations);
router.delete("/organization/:orgId", deleteOrganization); // Add route for deleting an organization

// People management within an organization
router.get("/organization/:orgId/people", getPeopleInOrganization);
router.post("/organization/:orgId/people", addPersonToOrganization);
router.post("/organization/:orgId/import-people", upload.single("file"), importPeopleToOrganization);

// Individual person management
router.put("/person/:personId", updatePerson);
router.delete("/person/:personId", deletePerson);

export default router;
