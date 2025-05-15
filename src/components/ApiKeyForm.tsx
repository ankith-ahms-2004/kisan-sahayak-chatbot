
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ApiKeyFormProps {
  initialValue?: string;
  onSave: (key: string) => void;
}

const ApiKeyForm = ({ initialValue = "", onSave }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm text-blue-700">
          You need a Perplexity API key to use this service. 
          Get one from <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Perplexity AI</a>.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label htmlFor="apiKey">Perplexity API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="Enter your Perplexity API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={!apiKey.trim()}
      >
        Save API Key
      </Button>
    </form>
  );
};

export default ApiKeyForm;
