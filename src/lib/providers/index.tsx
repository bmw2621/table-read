"use client";

import { FC, PropsWithChildren } from "react";
import AccountProvider from "./AccountProvider";
import ReactQueryProvider from "./queryClientProvider";

const Providers: FC<PropsWithChildren> = ({ children }) => (
  <ReactQueryProvider>
    <AccountProvider>{children}</AccountProvider>
  </ReactQueryProvider>
);

export default Providers;
