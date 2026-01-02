"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, FC, PropsWithChildren, useContext } from "react";
import { Troupe } from "../typedefs";
/**
 * Types
 */
type AccountContextType = {
  isLoadingTroupes: boolean;
  troupes: Troupe[];
};

/**
 * Context
 */
const AccountContext = createContext<AccountContextType>({
  isLoadingTroupes: false,
  troupes: [],
});

export const useAccount = () => useContext(AccountContext);

/**
 * Component
 */
const AccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: troupes, isLoading: isLoadingTroupes } = useQuery({
    queryKey: ["troupes"],
    queryFn: async () => {
      const response = await fetch("/api/troupes");
      const data = await response.json();
      return data.troupes;
    },
  });
  return (
    <AccountContext.Provider value={{ troupes, isLoadingTroupes }}>
      {children}
    </AccountContext.Provider>
  );
};

export default AccountProvider;
