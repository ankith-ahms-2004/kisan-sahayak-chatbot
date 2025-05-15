
import { useState } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ApiKeyForm from "./ApiKeyForm";

interface SettingsDialogProps {
  apiKey: string | null;
  onApiKeySave: (key: string) => void;
}

const SettingsDialog = ({ apiKey, onApiKeySave }: SettingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="bg-green-600 hover:bg-green-700 text-white hover:text-white">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API key for the Perplexity AI service.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ApiKeyForm 
            initialValue={apiKey || ""} 
            onSave={(key) => {
              onApiKeySave(key);
              setIsOpen(false);
            }} 
          />
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>
            Note: Your API key is stored locally in your browser and is not sent to our servers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
