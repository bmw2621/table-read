"use client";

import { ScriptWithOwnerType, Troupe } from "@/lib/typedefs";
import { FC } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateScriptInput, UpdateScriptInput } from "@/lib/scripts/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ZodSchema } from "zod";

/**
 * Types
 */
type Props =
  | {
      script: ScriptWithOwnerType;
      action: "update";
      onSubmit: (data: UpdateScriptInput) => Promise<void>;
      resolver: ZodSchema<UpdateScriptInput>;
    }
  | {
      script?: undefined;
      action: "create";
      onSubmit: (data: CreateScriptInput) => Promise<void>;
      resolver: ZodSchema<CreateScriptInput>;
    };

const ScriptForm: FC<Props> = ({ onSubmit, resolver, action, script }) => {
  const defaultValues =
    action === "update" && script
      ? {
          id: script.id,
          title: script.title,
          troupeId: script.troupeId || undefined,
        }
      : {};
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resolver),
    defaultValues,
  });
  const troupes: Troupe[] = [];
  return (
    <form
      id="script-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2"
    >
      {action === "update" && (
        <Input type="hidden" {...register("id")} value={script.id} />
      )}
      <Label>
        <h3 className="text-sm font-bold">Title</h3>
        <Input type="text" {...register("title")} className="bg-white" />
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
  );
};

export default ScriptForm;
