"use client";

import ScriptForm from "@/components/script/ScriptForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreateScriptInput,
  createScriptSchema,
} from "@/lib/scripts/validation";
import { LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";
import { useScriptCreate } from "./queriesMutations";

/**
 * Component
 */
const AddScriptButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const createScriptMutation = useScriptCreate(() => setIsOpen(false));
  const onSubmit = async (data: CreateScriptInput) => {
    await createScriptMutation.mutateAsync(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full aspect-square p-0 h-6 shadow">
          <Plus className="size-4!" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Script</DialogTitle>
        </DialogHeader>
        <ScriptForm
          onSubmit={onSubmit}
          resolver={createScriptSchema}
          action="create"
        />
        <DialogFooter>
          <Button form="script-form" disabled={createScriptMutation.isPending}>
            {createScriptMutation.isPending && (
              <LoaderCircle className="animate-spin" />
            )}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScriptButton;
