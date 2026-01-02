import { Session } from "next-auth";
import { FC } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import Image from "next/image";
import myIcon from "@/assets/logoMask.svg";
import { Separator } from "../ui/separator";
import { SignoutButton } from "../auth/signout-button";
/**
 * Types
 */
type Props = {
  session: Session;
};

/**
 * Component
 */
const Header: FC<Props> = ({ session }) => {
  return (
    <header className="bg-primary">
      <div className="w-full max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <h1 className="text-primary-foreground">Table Read</h1>
        <Popover>
          <PopoverTrigger>
            <div className="rounded-full bg-secondary p-1 shadow-inner shadow-gray-200/50">
              <Image
                src={myIcon}
                alt="Table Read Account"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-5">
            <div className="flex flex-col w-content">
              <dl className="mt-4 space-y-2">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500">
                    Username:
                  </dt>
                  <dd className="ml-4 text-sm text-gray-900">
                    {(session.user as any)?.username || session.user?.name}
                  </dd>
                </div>
                {session.user?.name && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">Name:</dt>
                    <dd className="ml-4 text-sm text-gray-900">
                      {session.user.name}
                    </dd>
                  </div>
                )}
                {session.user?.email && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">
                      Email:
                    </dt>
                    <dd className="ml-4 text-sm text-gray-900">
                      {session.user.email}
                    </dd>
                  </div>
                )}
                {session.user?.id && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">
                      User ID:
                    </dt>
                    <dd className="ml-4 text-sm text-gray-900 font-mono">
                      {session.user.id}
                    </dd>
                  </div>
                )}
              </dl>
              <Separator className="my-2" />
              <SignoutButton />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

export default Header;
