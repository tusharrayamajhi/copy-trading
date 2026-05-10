"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import toast from "react-hot-toast";

interface User {
  id: string;
  walletAddress: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async () => {
    if (!publicKey || !signMessage) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      const message = new TextEncoder().encode(`Sign this message for authenticating with your wallet. Nonce: ${nonce}`);
      const signature = await signMessage(message);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          nonce,
        }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setUser(data.user);
        toast.success("Successfully logged in");
      } else {
        toast.error("Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      await disconnect();
      toast.success("Logged out");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
