"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreateTroupeInput,
  createTroupeSchema,
} from "@/lib/troupes/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTroupeCreate } from "../queriesMutations";

/**
 * Component
 */
const AddTroupeButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const createTroupeMutation = useTroupeCreate(() => setIsOpen(false));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTroupeInput>({
    resolver: zodResolver(createTroupeSchema),
  });
  const onSubmit = async (data: CreateTroupeInput) => {
    await createTroupeMutation.mutateAsync(data);
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
          <DialogTitle>Create Troupe</DialogTitle>
        </DialogHeader>
        <form
          id="troupe-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <Label>
            <h3 className="text-sm font-bold">Troupe Name</h3>
            <Input type="text" {...register("name")} className="bg-white" />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </Label>
        </form>
        <DialogFooter>
          <Button form="troupe-form" disabled={createTroupeMutation.isPending}>
            {createTroupeMutation.isPending && (
              <LoaderCircle className="animate-spin" />
            )}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTroupeButton;
