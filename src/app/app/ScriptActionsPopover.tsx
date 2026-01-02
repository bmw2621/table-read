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
import { Edit, EllipsisVertical, Trash2 } from "lucide-react";
import { FC, useState } from "react";

/**
 * Types
 */
type Props = {
  script: ScriptWithOwnerType;
};

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
          <EllipsisVertical className="size-4!" />
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="hover:bg-transparent hover:text-black justify-start p-0 h-5"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="text-primary" />
              Edit
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-transparent hover:text-black justify-start p-0 h-5"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="text-accent" />
              Delete
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
