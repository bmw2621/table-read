"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FC } from "react";
import { troupeOptions } from "../queriesMutations";

/**
 * Component
 */
const TroupesList: FC = () => {
  const { data: troupes } = useSuspenseQuery(troupeOptions);

  if (troupes.length === 0) return <div>No troupes found</div>;

  return (
    <Table>
      <TableBody>
        {troupes.map((troupe) => (
          <TableRow key={troupe.id}>
            <TableCell>{troupe.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TroupesList;
