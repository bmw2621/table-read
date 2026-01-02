"use client";

import { Button } from "@/components/ui/button";

import { useScriptDelete } from "@/app/app/queriesMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScriptWithOwnerType } from "@/lib/typedefs";
import { Icon } from "@iconify/react";
import { FC, useState } from "react";

/**
 * Types
 */
type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  script: ScriptWithOwnerType;
};

/**
 * Component
 */
const DeleteScriptDialog: FC<Props> = ({ isOpen, setIsOpen, script }) => {
  const [confirmDeletion, setConfirmDeletion] = useState("");
  const scriptDeleteMutation = useScriptDelete(() => setIsOpen(false));
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Script</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this script?
          </DialogDescription>
        </DialogHeader>
        <p>
          To confirm deletion, type the script title{" "}
          <span className="font-bold">{script.title}</span> into the input
          below.
        </p>
        <Input
          type="text"
          name="confirm"
          placeholder="Type the script title to confirm deletion"
          className="bg-white"
          onChange={(e) => {
            setConfirmDeletion(e.target.value);
          }}
        />
        <DialogFooter>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => scriptDeleteMutation.mutate(script.id)}
            disabled={
              confirmDeletion !== script.title || scriptDeleteMutation.isPending
            }
          >
            {scriptDeleteMutation.isPending && (
              <Icon icon="lucide:loader-circle" className="animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteScriptDialog;
