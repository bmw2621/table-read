import { CreateScriptInput, UpdateScriptInput } from "@/lib/scripts/validation";
import { CreateTroupeInput } from "@/lib/troupes/validation";
import {
  ApiResponse,
  ScriptWithOwnerType,
  TroupeWithCount,
} from "@/lib/typedefs";
import { getQueryClient } from "@/lib/utils/getQueryClient";
import {
  mutationOptions,
  queryOptions,
  useMutation,
} from "@tanstack/react-query";

/**
 * Query Client
 */
const queryClient = getQueryClient();

/**
 * Queries / Mutations
 */

// Scripts
const getScripts = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/scripts");
    const data = await response.json();
    return data.scripts as ScriptWithOwnerType[];
  } catch (error) {
    console.error(error);
    return [];
  }
};
export const scriptOptions = queryOptions({
  queryKey: ["scripts"],
  queryFn: getScripts,
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
      mutationFn: async (data: UpdateScriptInput) => {
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

export const useScriptCreate = (onSuccess: () => void) =>
  useMutation(
    mutationOptions({
      mutationFn: async (data: CreateScriptInput) => {
        const response = await fetch(`/api/scripts`, {
          method: "POST",
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

// Troupes

const getTroupes = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/troupes");
    const data: ApiResponse<{ troupes: TroupeWithCount[] }> =
      await response.json();
    return data.troupes;
  } catch (error) {
    console.error(error);
    return [];
  }
};
export const troupeOptions = queryOptions({
  queryKey: ["troupes"],
  queryFn: getTroupes,
});

export const useTroupeCreate = (onSuccess: () => void) =>
  useMutation(
    mutationOptions({
      mutationFn: async (data: CreateTroupeInput) =>
        fetch(`/api/troupes`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: troupeOptions.queryKey,
        });
        onSuccess();
      },
    })
  );
