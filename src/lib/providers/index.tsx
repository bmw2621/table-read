"use client";

import { FC, PropsWithChildren } from "react";
import ReactQueryProvider from "./queryClientProvider";

const Providers: FC<PropsWithChildren> = ({ children }) => (
  <ReactQueryProvider>{children}</ReactQueryProvider>
);

export default Providers;
