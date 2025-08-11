import { createContext, useContext, PropsWithChildren, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface Product {
  short_url: string;
}

interface AppContextType {
  products: Product[];
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function AppProvider({ children }: PropsWithChildren) {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/gumroad/products"],
    retry: false,
  });

  const value = useMemo(
    () => ({
      products: products as Product[],
    }),
    [products, isLoading],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
