"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  walletAddress: string;
  role: string;
  traderProfile?: any;
  investorProfile?: any;
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
  const isLoggingIn = useRef(false);
  const router = useRouter();

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

  // Auto-login when wallet is connected
  useEffect(() => {
    if (publicKey && !user && !isLoggingIn.current && !isLoading) {
      login();
    }
  }, [publicKey, user, isLoading]);

  const login = async () => {
    if (!publicKey || !signMessage || isLoggingIn.current) return;

    isLoggingIn.current = true;
    const loadingToast = toast.loading("Authenticating...");

    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      const message = new TextEncoder().encode(`Sign this message for authenticating with CopyCatt. Nonce: ${nonce}`);
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
        toast.success("Successfully logged in", { id: loadingToast });
        
        // Force a small delay and then refresh/redirect to ensure all state is synced
        router.refresh();
        if (window.location.pathname === "/") {
          router.push("/trader");
        }
      } else {
        toast.error("Authentication failed", { id: loadingToast });
        await disconnect();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login", { id: loadingToast });
      await disconnect();
    } finally {
      isLoggingIn.current = false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      await disconnect();
      toast.success("Logged out");
      router.push("/");
      router.refresh();
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
