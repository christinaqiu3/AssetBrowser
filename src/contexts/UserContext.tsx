
import React, { createContext, useContext, useState } from "react";

type User = {
  name: string;
  role: "admin" | "user";
};

type UserContextType = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({ name: "Demo User", role: "user" });

  const login = (name: string) => {
    setUser({ name, role: "user" });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
