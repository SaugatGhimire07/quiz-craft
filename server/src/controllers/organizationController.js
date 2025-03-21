import Organization from "../models/Organization.js";
import Person from "../models/Person.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import xlsx from "xlsx";
import fs from "fs";
import asyncHandler from "express-async-handler";
import { customAlphabet } from "nanoid";

// Create a custom nanoid generator for 8-character alphanumeric IDs
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

// Create a new organization
export const createOrganization = async (req, res) => {
  const { name } = req.body;

  try {
    // Validate that the organization name is provided
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Organization name is required." });
    }

    // Validate that the organization name is not too short or too long
    if (name.length < 3 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Organization name must be between 3 and 50 characters." });
    }

    // Ensure unique orgId
    let orgId;
    let isUnique = false;

    while (!isUnique) {
      orgId = nanoid(); // Generate an 8-character alphanumeric ID
      const existingOrg = await Organization.findOne({ orgId });
      if (!existingOrg) {
        isUnique = true;
      }
    }

    // Create the organization with the generated orgId
    const organization = new Organization({ name, orgId });
    await organization.save();

    res.status(201).json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ error: "Failed to create organization." });
  }
};

// Get all organizations
export const getAllOrganizations = asyncHandler(async (req, res) => {
  const organizations = await Organization.find();
  res.status(200).json(organizations);
});

// Get people in an organization by orgId
export const getPeopleInOrganization = asyncHandler(async (req, res) => {
  const { orgId } = req.params;

  // Ensure orgId maps to an actual _id
  const organization = await Organization.findOne({ orgId }).select("_id");
  if (!organization) {
    return res.status(404).json({ error: "Organization not found." });
  }

  const people = await Person.find({ organization: organization._id });
  res.status(200).json(people);
});

// Add a person to an organization by orgId
export const addPersonToOrganization = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const { name, email, stdId } = req.body; // Accept stdId from the request body

  // Validate required fields
  if (!name || !email || !stdId) {
    return res.status(400).json({ error: "Name, email, and stdId are required." });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Check if the organization exists
  const organization = await Organization.findOne({ orgId }).select("_id");
  if (!organization) {
    return res.status(404).json({ error: "Organization not found." });
  }

  // Check for duplicate email
  const existingPersonByEmail = await Person.findOne({ email });
  if (existingPersonByEmail) {
    return res.status(400).json({ error: "A person with this email already exists." });
  }

  // Check for duplicate stdId
  const existingPersonByStdId = await Person.findOne({ stdId });
  if (existingPersonByStdId) {
    return res.status(400).json({ error: "A person with this stdId already exists." });
  }

  // Generate a random password and hash it
  const password = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the person
  const person = new Person({
    stdId,
    name,
    email,
    password: hashedPassword,
    organization: organization._id,
  });

  await person.save();

  // Return the created person
  res.status(201).json({
    stdId: person.stdId,
    name: person.name,
    email: person.email,
    organization: person.organization,
  });
});

// Import people to an organization by orgId
export const importPeopleToOrganization = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Ensure you're sending the correct FormData key ('file')." });
    }

    const { orgId } = req.params;

    // Check if the organization exists
    const organization = await Organization.findOne({ orgId }).select("_id");
    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    let data;
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet);
    } catch (parseError) {
      return res.status(400).json({ error: "Failed to parse the Excel file." });
    } finally {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }

    if (!data.length) {
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    const newPeople = [];
    const errors = [];

    for (const [index, row] of data.entries()) {
      const { stdId, name, email } = row;

      // Validate required fields
      if (!stdId || !name || !email) {
        errors.push({ row: index + 1, error: "stdId, name, and email are required." });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ row: index + 1, error: `Invalid email format: ${email}` });
        continue;
      }

      // Check for duplicate stdId
      const existingPersonByStdId = await Person.findOne({ stdId });
      if (existingPersonByStdId) {
        errors.push({ row: index + 1, error: `Duplicate stdId: ${stdId}` });
        continue;
      }

      // Check for duplicate email
      const existingPersonByEmail = await Person.findOne({ email });
      if (existingPersonByEmail) {
        errors.push({ row: index + 1, error: `Duplicate email: ${email}` });
        continue;
      }

      // Generate a random password and hash it
      const password = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      const person = new Person({
        stdId,
        name,
        email,
        password: hashedPassword,
        organization: organization._id,
      });

      try {
        await person.save();
        newPeople.push(person);
      } catch (saveError) {
        errors.push({ row: index + 1, error: `Failed to save: ${saveError.message}` });
      }
    }

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    res.status(200).json(newPeople); // Return the list of created people
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

// Update a person's details
export const updatePerson = asyncHandler(async (req, res) => {
  const { personId } = req.params;
  const { name, email } = req.body;

  const person = await Person.findByIdAndUpdate(personId, { name, email }, { new: true });
  if (!person) return res.status(404).json({ error: "Person not found." });

  res.status(200).json(person);
});

// Delete a person from an organization
export const deletePerson = asyncHandler(async (req, res) => {
  const { personId } = req.params;

  const person = await Person.findByIdAndDelete(personId);
  if (!person) return res.status(404).json({ error: "Person not found." });

  res.status(200).json({ message: "Person deleted successfully" });
});

export const deleteOrganization = async (req, res) => {
  const { orgId } = req.params;

  try {
    // Find the organization
    const organization = await Organization.findOne({ orgId });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Delete all people associated with the organization
    await Person.deleteMany({ organization: organization._id });

    // Delete the organization
    await Organization.findOneAndDelete({ orgId });

    res.status(200).json({ message: "Organization and all associated people deleted successfully." });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({ error: "Failed to delete organization." });
  }
};