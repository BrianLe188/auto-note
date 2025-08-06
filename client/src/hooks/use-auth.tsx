import {
  useState,
  useEffect,
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null,
  );

  // Query user data if token exists
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        return response.json();
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem("authToken");
        setToken(null);
        throw error;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return apiRequest("POST", "/api/auth/login", { email, password });
    },
    onSuccess: (data: any) => {
      const newToken = data.token;
      setToken(newToken);
      localStorage.setItem("authToken", newToken);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      return apiRequest("POST", "/api/auth/signup", userData);
    },
    onSuccess: (data: any) => {
      const newToken = data.token;
      setToken(newToken);
      localStorage.setItem("authToken", newToken);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    await signupMutation.mutateAsync(userData);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      // Update the default authorization header for future requests
      const originalFetch = window.fetch;
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (token && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      };
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user: user || null,
      isLoading:
        isLoading || loginMutation.isPending || signupMutation.isPending,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
