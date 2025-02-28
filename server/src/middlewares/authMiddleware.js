import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Update the auth middleware to check session token
const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if session is still valid
      if (user.sessionToken !== decoded.sessionToken) {
        return res
          .status(401)
          .json({ message: "Session expired. Please log in again." });
      }

      // Attach user to request object
      req.user = user;

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized! Only admin can access" });
  }
};

export { protect, admin };
