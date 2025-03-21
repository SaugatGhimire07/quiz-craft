import express from "express";
import {
  createOrganization,
  getAllOrganizations,
  getPeopleInOrganization,
  addPersonToOrganization,
  updatePerson,
  deletePerson,
} from "../controllers/organizationController.js";

const router = express.Router();

router.post("/organization", createOrganization);
router.get("/organization/all", getAllOrganizations);
router.get("/organization/:orgId/people", getPeopleInOrganization);
router.post("/organization/:orgId/people", addPersonToOrganization);
router.put("/person/:personId", updatePerson);
router.delete("/person/:personId", deletePerson);

export default router;