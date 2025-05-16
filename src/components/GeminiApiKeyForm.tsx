
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { DEFAULT_GEMINI_API_KEY } from "@/utils/geminiApi";

interface GeminiApiKeyFormProps {
  initialValue?: string;
  onSave: (key: string) => void;
}

const GeminiApiKeyForm = ({ initialValue = "", onSave }: GeminiApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState(initialValue || DEFAULT_GEMINI_API_KEY);
  
  useEffect(() => {
    // Initialize with default key if no initial value is provided
    if (!initialValue && DEFAULT_GEMINI_API_KEY) {
      setApiKey(DEFAULT_GEMINI_API_KEY);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyToSave = apiKey.trim() || DEFAULT_GEMINI_API_KEY;
    if (keyToSave) {
      onSave(keyToSave);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm text-blue-700">
          {apiKey === DEFAULT_GEMINI_API_KEY ? (
            <>A default API key is being used. You can continue with this key or add your own.</>
          ) : (
            <>You can use the default key or get your own from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Google AI Studio</a>.</>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label htmlFor="geminiApiKey">Gemini API Key</Label>
        <Input
          id="geminiApiKey"
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Save API Key
      </Button>
    </form>
  );
};

export default GeminiApiKeyForm;
