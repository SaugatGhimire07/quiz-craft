import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true,
  isVerified: false,
});
