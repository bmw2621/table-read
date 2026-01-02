"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FC } from "react";
import { scriptOptions } from "./queriesMutations";
import ScriptActionsPopover from "./ScriptActionsPopover";

/**
 * Component
 */
const ScriptsList: FC = () => {
  const { data: scripts } = useSuspenseQuery(scriptOptions);

  return (
    <Table>
      <TableBody>
        {scripts.map((script) => (
          <TableRow key={script.id}>
            <TableCell>
              <Link href={`/scripts/${script.id}`}>{script.title}</Link>
            </TableCell>
            <TableCell>
              {script.ownerType === "user" ? "-" : script.troupeId}
            </TableCell>
            <TableCell align="right">
              <ScriptActionsPopover script={script} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ScriptsList;
