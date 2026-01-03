import { FC } from "react";
import AddTroupeButton from "./AddTroupeButton";
import TroupesList from "./TroupesList";

/**
 * Component
 */
const UserTroupes: FC = () => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Troupes</h2>
          <AddTroupeButton />
        </div>
        <div className="rounded-md border border-gray-200 p-4">
          <div className="max-h-96 overflow-y-auto">
            <TroupesList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTroupes;
