
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, QrCode, Send, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyzeImageWithGemini } from "@/utils/geminiApi";

const WhatsAppIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whatsappNumber = "8618384071";

  const connectToWhatsApp = () => {
    // Simulate connection to WhatsApp Business API
    toast({
      title: "WhatsApp Connected",
      description: "Your application is now connected to WhatsApp. Farmers can send images to the provided number.",
    });
    setIsConnected(true);
    localStorage.setItem("whatsapp_connected", "true");
  };

  // Check if previously connected
  useEffect(() => {
    const connected = localStorage.getItem("whatsapp_connected") === "true";
    setIsConnected(connected);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

    const geminiApiKey = localStorage.getItem("gemini_api_key");
    if (!geminiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your Gemini API key in settings",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert image to base64
      const base64Image = await readFileAsBase64(selectedImage);
      
      // Directly analyze the image with Gemini instead of sending to WhatsApp
      // In a real implementation, this would use the WhatsApp Business API to send
      const analysisResult = await analyzeImageWithGemini(base64Image, geminiApiKey);
      
      // Simulate successful WhatsApp sending and analysis
      toast({
        title: "Image Analysis Complete",
        description: `Detected: ${analysisResult.disease}. Analysis results would be sent back to the farmer via WhatsApp.`,
      });
      
      // Clear the selected image
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error Processing Image",
        description: "There was an error analyzing the image. Please try again.",
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
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
          WhatsApp Integration
        </CardTitle>
        <CardDescription>
          Enable farmers to send crop images directly via WhatsApp for instant disease analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Analyzing...' : 'Analyze Image'}
                </Button>
              </div>
              
              {selectedImage && (
                <div className="mt-3 text-sm text-gray-600">
                  Selected image: {selectedImage.name}
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
