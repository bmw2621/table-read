import { FC } from "react";
import AddScriptButton from "./AddScriptButton";
import ScriptsList from "./ScriptsList";

/**
 * Component
 */
const UserScripts: FC = () => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Scripts</h2>
          <AddScriptButton />
        </div>
        <div className="rounded-md border border-gray-200 p-4">
          <div className="max-h-96 overflow-y-auto">
            <ScriptsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserScripts;
