import Organization from "../models/Organization.js";
import Person from "../models/Person.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// Create a new organization
export const createOrganization = async (req, res) => {
  const { name } = req.body;

  try {
    const organization = new Organization({ name });
    await organization.save();
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all organizations
export const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.status(200).json(organizations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get people in an organization
export const getPeopleInOrganization = async (req, res) => {
  const { orgId } = req.params;

  try {
    const people = await Person.find({ organization: orgId });
    res.status(200).json(people);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a person to an organization
export const addPersonToOrganization = async (req, res) => {
  const { orgId } = req.params;
  const { name, email } = req.body;
  const password = uuidv4(); // Generate a random password

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const person = new Person({ name, email, password: hashedPassword, organization: orgId });
    await person.save();
    res.status(201).json(person);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a person's details
export const updatePerson = async (req, res) => {
  const { personId } = req.params;
  const { name, email } = req.body;

  try {
    const person = await Person.findByIdAndUpdate(personId, { name, email }, { new: true });
    res.status(200).json(person);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a person from an organization
export const deletePerson = async (req, res) => {
  const { personId } = req.params;

  try {
    await Person.findByIdAndDelete(personId);
    res.status(200).json({ message: "Person deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};