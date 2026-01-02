"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useAccount } from "@/lib/providers/AccountProvider";
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
  const { troupes, isLoadingTroupes } = useAccount();

  return (
    <Table>
      <TableBody>
        {scripts.map((script) => (
          <TableRow key={script.id}>
            <TableCell>
              <Link href={`/scripts/${script.id}`}>{script.title}</Link>
            </TableCell>
            {!isLoadingTroupes && (
              <TableCell>
                {script.troupeId
                  ? troupes?.find((troupe) => troupe.id === script.troupeId)
                      ?.name
                  : "-"}
              </TableCell>
            )}
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
