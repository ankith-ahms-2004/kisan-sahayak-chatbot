import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, QrCode, Send, Upload, AlertCircle, X, Loader2, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyzeImageWithGemini, DEFAULT_GEMINI_API_KEY } from "@/utils/geminiApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

// Default Gemini API key - Hardcoded to ensure it's always available
const DEFAULT_API_KEY = "AIzaSyAgliKnRhVVdoW-2bgMFcvN4fMYLSBSqJ0";

interface WhatsAppIntegrationProps {
  defaultApiKey?: string;
}

const WhatsAppIntegration = ({ defaultApiKey }: WhatsAppIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whatsappNumber = "8618384071";
  const [manualApiKey, setManualApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Initialize manual API key from localStorage or default
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key") || defaultApiKey || DEFAULT_GEMINI_API_KEY;
    setManualApiKey(storedKey);
  }, [defaultApiKey]);

  // Clear data when component unmounts
  useEffect(() => {
    return () => {
      // Clear any selected images when leaving the component
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(null);
      setImagePreview(null);
      setAnalysisResult(null);
    };
  }, []);

  // Check if previously connected (just for this session)
  useEffect(() => {
    const connected = sessionStorage.getItem("whatsapp_connected") === "true";
    setIsConnected(connected);
    
    // Reset error state when component mounts
    setError(null);
  }, []);

  const connectToWhatsApp = () => {
    // Simulate connection to WhatsApp Business API
    toast({
      title: "WhatsApp Connected",
      description: "Your application is now connected to WhatsApp. Farmers can send images to the provided number.",
    });
    setIsConnected(true);
    // Use sessionStorage instead of localStorage to keep connection just for this session
    sessionStorage.setItem("whatsapp_connected", "true");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Clear any previous object URLs to prevent memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      const file = e.target.files[0];
      setSelectedImage(file);
      setError(null);
      setAnalysisResult(null);
      
      // Create preview using URL.createObjectURL for better performance
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getApiKey = (): string => {
    // First check manual entry if available
    if (manualApiKey && manualApiKey.trim()) {
      return manualApiKey.trim();
    }
    
    // Next check localStorage
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey && storedKey.trim()) {
      return storedKey;
    }
    
    // Next, use the provided defaultApiKey prop if available
    if (defaultApiKey && defaultApiKey.trim()) {
      return defaultApiKey;
    }
    
    // Finally, fall back to the hardcoded default key
    return DEFAULT_GEMINI_API_KEY;
  };

  const saveApiKey = () => {
    if (manualApiKey && manualApiKey.trim()) {
      localStorage.setItem("gemini_api_key", manualApiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved for this session",
      });
      setShowApiKeyInput(false);
    }
  };

  const toggleApiKeyInput = () => {
    setShowApiKeyInput(!showApiKeyInput);
    if (!showApiKeyInput) {
      // When opening the input, initialize with current key
      const currentKey = localStorage.getItem("gemini_api_key") || defaultApiKey || DEFAULT_GEMINI_API_KEY;
      setManualApiKey(currentKey);
    }
  };

  const sendImageToWhatsApp = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to send",
        variant: "destructive",
      });
      return;
    }

    const apiKey = getApiKey();
    console.log("Using API key:", apiKey ? apiKey.substring(0, 10) + "..." : "none");
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Convert image to base64
      const base64Image = await readFileAsBase64(selectedImage);
      
      console.log("Sending image for analysis...");
      
      // Directly analyze the image with Gemini
      const analysis = await analyzeImageWithGemini(base64Image, apiKey);
      
      // Format the analysis result for display
      const formattedResult = `
# Analysis Results: ${analysis.disease}

## Description
${analysis.description}

## Preventive Measures
${analysis.preventiveMeasures.map(measure => `- ${measure}`).join('\n')}

## Treatment Options
${analysis.treatment}

## Future Precautions
${analysis.precautions.map(precaution => `- ${precaution}`).join('\n')}
      `;
      
      setAnalysisResult(formattedResult);
      
      toast({
        title: "Image Analysis Complete",
        description: `Detected: ${analysis.disease}`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to analyze the image. Please check your API key and try again.");
      toast({
        title: "Error Processing Image",
        description: "There was an error analyzing the image. Please verify your API key is valid.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert File to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
            WhatsApp Integration
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleApiKeyInput}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            API Key
          </Button>
        </CardTitle>
        <CardDescription>
          Enable farmers to send crop images directly via WhatsApp for instant disease analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showApiKeyInput && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-sm font-medium mb-2">Enter Gemini API Key</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter Gemini API Key"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveApiKey} disabled={!manualApiKey.trim()}>
                Save
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Get a key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google AI Studio</a>
            </p>
          </div>
        )}
        
        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">WhatsApp Active</h3>
                <p className="text-sm text-gray-600">
                  Farmers can send images to: <span className="font-semibold">{whatsappNumber}</span>
                </p>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Demo image upload (simulates WhatsApp integration) */}
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="font-medium mb-2">Test Image Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Simulate the WhatsApp image analysis process with a test image:
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect} 
                accept="image/*"
                className="hidden"
              />
              
              {imagePreview && (
                <div className="mb-4 relative">
                  <div className="rounded-md overflow-hidden border border-gray-200 w-full max-w-xs mx-auto">
                    <img 
                      src={imagePreview} 
                      alt="Selected crop" 
                      className="w-full h-auto object-cover" 
                    />
                    <button 
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={triggerFileSelect}
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedImage ? 'Change Image' : 'Select Image'}
                </Button>
                
                <Button 
                  onClick={sendImageToWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedImage || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </div>
              
              {selectedImage && !imagePreview && (
                <div className="mt-3 text-sm text-gray-600">
                  Selected image: {selectedImage.name}
                </div>
              )}
              
              {analysisResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-md text-sm markdown">
                  <h3 className="text-lg font-medium mb-2">Analysis Results</h3>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 overflow-auto max-h-96">
                      {analysisResult}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Instructions for farmers:</p>
              <ol className="ml-5 list-decimal space-y-1 mt-2">
                <li>Save this number: {whatsappNumber}</li>
                <li>Open WhatsApp and send a message to this number</li>
                <li>Upload crop images directly in the chat</li>
                <li>Receive disease analysis and treatment recommendations</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your application to WhatsApp to enable farmers to send crop images directly for analysis.
            </p>
            <Button 
              onClick={connectToWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Connect to WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppIntegration;
