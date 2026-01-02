import { ScriptWithOwnerType } from "@/lib/typedefs";
import { getQueryClient } from "@/lib/utils/getQueryClient";
import {
  mutationOptions,
  queryOptions,
  useMutation,
} from "@tanstack/react-query";

/**
 * Types
 */
export type UpdateScriptFormData = {
  id: string;
  troupeId: string | undefined;
  title: string;
};

/**
 * Query Client
 */
const queryClient = getQueryClient();

/**
 * Queries / Mutations
 */
export const scriptOptions = queryOptions({
  queryKey: ["scripts"],
  queryFn: async () => {
    const response = await fetch("/api/scripts");
    const data = await response.json();
    return data.scripts as ScriptWithOwnerType[];
  },
});

export const useScriptDelete = (onSuccess: () => void) =>
  useMutation(
    mutationOptions({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/scripts/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        return data.script as ScriptWithOwnerType;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: scriptOptions.queryKey,
        });
        onSuccess();
      },
    })
  );

export const useScriptUpdate = (onSuccess: () => void) =>
  useMutation(
    mutationOptions({
      mutationFn: async (data: UpdateScriptFormData) => {
        const response = await fetch(`/api/scripts/${data.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        const responseData = await response.json();
        console.log(responseData);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: scriptOptions.queryKey,
        });
        onSuccess();
      },
    })
  );
