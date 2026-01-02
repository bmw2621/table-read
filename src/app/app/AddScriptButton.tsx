import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

/**
 * Component
 */
const AddScriptButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button className="rounded-full aspect-square p-0 h-6 shadow">
        <Icon className="size-4!" height="none" icon="radix-icons:plus" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Script</DialogTitle>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

export default AddScriptButton;
