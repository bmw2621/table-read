"use client";

import { Button } from "@/components/ui/button";
import { ScriptWithOwnerType } from "@/lib/typedefs";
import { Icon } from "@iconify/react";
import { FC } from "react";

import { useScriptUpdate } from "@/app/app/queriesMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UpdateScriptInput,
  updateScriptSchema,
} from "@/lib/scripts/validation";
import ScriptForm from "./ScriptForm";
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
const EditScriptDialog: FC<Props> = ({ isOpen, setIsOpen, script }) => {
  const scriptUpdateMutation = useScriptUpdate(() => setIsOpen(false));
  // TODO: Replace with actual troupes from user's troupes

  const onSubmit = async (data: UpdateScriptInput) => {
    await scriptUpdateMutation.mutateAsync(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Script</DialogTitle>
          <DialogDescription>Update the script details</DialogDescription>
        </DialogHeader>
        <ScriptForm
          script={script}
          onSubmit={onSubmit}
          resolver={updateScriptSchema}
          action="update"
        />
        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            form="script-form"
            disabled={scriptUpdateMutation.isPending}
          >
            {scriptUpdateMutation.isPending && (
              <Icon icon="lucide:loader-circle" className="animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditScriptDialog;
