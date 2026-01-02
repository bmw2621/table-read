"use client";

import { Button } from "@/components/ui/button";
import { ScriptWithOwnerType } from "@/lib/typedefs";
import { Icon } from "@iconify/react";
import { FC } from "react";

import { updateScriptSchema } from "@/app/app/ScriptActionsPopover";
import {
  UpdateScriptFormData,
  useScriptUpdate,
} from "@/app/app/queriesMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
  const troupes = [
    {
      id: "893459873457",
      name: "Troupe 1",
    },
    {
      id: "893459873458",
      name: "Troupe 2",
    },
  ];
  // Form setup
  const formActions = useForm<UpdateScriptFormData>({
    mode: "onSubmit",
    defaultValues: {
      id: script.id,
      title: script.title,
      troupeId: script.troupeId || undefined,
    },
    resolver: zodResolver(updateScriptSchema),
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = formActions;

  const onSubmit = async (data: UpdateScriptFormData) => {
    const payload = {
      ...data,
      troupeId: data.troupeId === "none" ? undefined : data.troupeId,
    };
    await scriptUpdateMutation.mutateAsync(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Script</DialogTitle>
          <DialogDescription>Update the script details</DialogDescription>
        </DialogHeader>
        <form
          id="edit-script-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <Input type="hidden" {...register("id")} value={script.id} />
          <Label>
            <h3 className="text-sm font-bold">Title</h3>
            <Input
              type="text"
              defaultValue={script.title}
              {...register("title")}
              className="bg-white"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </Label>
          <Label>
            <h3 className="text-sm font-bold">Troupe</h3>
            <Controller
              control={control}
              name="troupeId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} {...field}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a Troupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-gray-500 italic">
                      None
                    </SelectItem>
                    {troupes.map((troupe) => (
                      <SelectItem key={troupe.id} value={troupe.id}>
                        {troupe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Label>
        </form>
        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            form="edit-script-form"
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
