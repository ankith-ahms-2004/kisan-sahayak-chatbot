
import { useState } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeyForm from "./ApiKeyForm";
import GeminiApiKeyForm from "./GeminiApiKeyForm";

interface SettingsDialogProps {
  apiKey: string | null;
  geminiApiKey: string | null;
  onApiKeySave: (key: string) => void;
  onGeminiApiKeySave: (key: string) => void;
}

const SettingsDialog = ({ apiKey, geminiApiKey, onApiKeySave, onGeminiApiKeySave }: SettingsDialogProps) => {
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
            Configure your API keys for AI services.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="gemini">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perplexity">Text Analysis</TabsTrigger>
            <TabsTrigger value="gemini">Image Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="perplexity" className="py-4">
            <h3 className="text-sm font-medium mb-2">Perplexity API Key (Text Analysis)</h3>
            <ApiKeyForm 
              initialValue={apiKey || ""} 
              onSave={(key) => {
                onApiKeySave(key);
                setIsOpen(false);
              }} 
            />
          </TabsContent>
          
          <TabsContent value="gemini" className="py-4">
            <h3 className="text-sm font-medium mb-2">Gemini API Key (Image Analysis)</h3>
            {geminiApiKey && geminiApiKey.startsWith("AIzaSy") ? (
              <div className="mb-3 text-sm text-green-600">
                Default API key is being used. You can override it below if needed.
              </div>
            ) : null}
            <GeminiApiKeyForm 
              initialValue={geminiApiKey || ""} 
              onSave={(key) => {
                onGeminiApiKeySave(key);
                setIsOpen(false);
              }} 
            />
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>
            Note: Your API keys are stored locally in your browser and are not sent to our servers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
