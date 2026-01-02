"use client";

import DeleteScriptDialog from "@/components/script/DeleteScriptDialog";
import EditScriptDialog from "@/components/script/EditScriptDialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScriptWithOwnerType } from "@/lib/typedefs";
import { Icon } from "@iconify/react";
import { FC, useState } from "react";
import z from "zod";

/**
 * Types
 */
type Props = {
  script: ScriptWithOwnerType;
};

/**
 * Schemas
 */

export const updateScriptSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  troupeId: z.string().optional(),
});

/**
 * Component
 */
const ScriptActionsPopover: FC<Props> = ({ script }) => {
  // TODO: Replace with actual troupes from user's troupes
  const troupes = [
    {
      id: "1",
      name: "Troupe 1",
    },
    {
      id: "2",
      name: "Troupe 2",
    },
  ];
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <Popover>
        <PopoverTrigger>
          <Icon icon="radix-icons:dots-vertical" />
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="hover:bg-transparent hover:text-black justify-start p-0 h-5"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Icon className="text-primary" icon="lucide:edit" /> Edit
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-transparent hover:text-black justify-start p-0 h-5"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Icon className="text-accent" icon="radix-icons:trash" /> Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <EditScriptDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        script={script}
      />
      <DeleteScriptDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        script={script}
      />
    </>
  );
};

export default ScriptActionsPopover;
