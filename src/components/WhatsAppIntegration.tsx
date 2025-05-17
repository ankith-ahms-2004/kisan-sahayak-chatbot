
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, QrCode, Send, Upload, AlertCircle, X, Loader2, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyzeImageWithGemini, analyzeTextWithGemini, DEFAULT_GEMINI_API_KEY } from "@/utils/geminiApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Default Gemini API key - Hardcoded to ensure it's always available
const DEFAULT_API_KEY = "AIzaSyAgliKnRhVVdoW-2bgMFcvN4fMYLSBSqJ0";

interface WhatsAppIntegrationProps {
  defaultApiKey?: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isImage?: boolean;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
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
    
    // Add initial welcome message if connected
    if (connected && chatMessages.length === 0) {
      setChatMessages([{
        sender: 'assistant',
        content: "Welcome to Kisan Sahayak WhatsApp service! You can send images of your crops or ask questions about farming. How can I help you today?",
        timestamp: new Date()
      }]);
    }
  }, []);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const connectToWhatsApp = () => {
    // Simulate connection to WhatsApp Business API
    toast({
      title: "WhatsApp Connected",
      description: "Your application is now connected to WhatsApp. Farmers can send images to the provided number.",
    });
    setIsConnected(true);
    // Use sessionStorage instead of localStorage to keep connection just for this session
    sessionStorage.setItem("whatsapp_connected", "true");
    
    // Add initial welcome message
    setChatMessages([{
      sender: 'assistant',
      content: "Welcome to Kisan Sahayak WhatsApp service! You can send images of your crops or ask questions about farming. How can I help you today?",
      timestamp: new Date()
    }]);
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
      
      // Add a message to the chat showing the uploaded image
      setChatMessages([...chatMessages, {
        sender: 'user',
        content: objectUrl,
        timestamp: new Date(),
        isImage: true
      }]);
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
    console.log("Using model: gemini-2.0-flash");
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Convert image to base64
      const base64Image = await readFileAsBase64(selectedImage);
      
      console.log("Sending image for analysis...");
      
      // Add a loading message to the chat
      setChatMessages([...chatMessages, {
        sender: 'assistant',
        content: "Analyzing your image...",
        timestamp: new Date()
      }]);
      
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
      
      // Update the chat with the analysis results
      setChatMessages([...chatMessages.filter(msg => msg.content !== "Analyzing your image..."), {
        sender: 'assistant',
        content: formattedResult,
        timestamp: new Date()
      }]);
      
      toast({
        title: "Image Analysis Complete",
        description: `Detected: ${analysis.disease}`,
      });
      
      // Clear the image after successful analysis
      clearImage();
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to analyze the image. Please check your API key and try again.");
      
      // Update the chat with the error
      setChatMessages([...chatMessages.filter(msg => msg.content !== "Analyzing your image..."), {
        sender: 'assistant',
        content: "Sorry, I couldn't analyze that image. Please make sure it clearly shows the plant issues and try again.",
        timestamp: new Date()
      }]);
      
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
  
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const userMessage = messageInput.trim();
    setMessageInput("");
    
    // Add user message to chat
    const updatedMessages = [...chatMessages, {
      sender: 'user',
      content: userMessage,
      timestamp: new Date()
    }];
    
    setChatMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      // Add a typing indicator
      setChatMessages([...updatedMessages, {
        sender: 'assistant',
        content: "Thinking...",
        timestamp: new Date()
      }]);
      
      // Get API key
      const apiKey = getApiKey();
      
      // Use Gemini API for text analysis
      const analysisResult = await analyzeTextWithGemini(userMessage, apiKey);
      
      // Check if this is likely a disease analysis or a general question
      const isDiseaseQuery = userMessage.toLowerCase().includes("crop") || 
        userMessage.toLowerCase().includes("plant") || 
        userMessage.toLowerCase().includes("disease") ||
        userMessage.toLowerCase().includes("farm") ||
        userMessage.toLowerCase().includes("pest") ||
        userMessage.toLowerCase().includes("symptom");
      
      let formattedResponse = "";
      
      if (isDiseaseQuery) {
        // Format the analysis result into a readable structured message for disease queries
        formattedResponse = `
# Analysis Results: ${analysisResult.disease}

## Description
${analysisResult.description}

## Preventive Measures
${analysisResult.preventiveMeasures.map(measure => `- ${measure}`).join('\n')}

## Treatment Options
${analysisResult.treatment}

## Future Precautions
${analysisResult.precautions.map(precaution => `- ${precaution}`).join('\n')}
        `;
      } else {
        // For general questions, just use the description as the response
        formattedResponse = analysisResult.description;
      }
      
      // Update chat with the response (remove the typing indicator)
      setChatMessages([...updatedMessages, {
        sender: 'assistant',
        content: formattedResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      
      // Update chat with error message (remove the typing indicator)
      setChatMessages([...updatedMessages, {
        sender: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
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
            
            {/* WhatsApp Chat Interface */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-green-600 p-3 text-white">
                <h3 className="font-medium">Kisan Sahayak WhatsApp</h3>
              </div>
              
              <ScrollArea className="h-[350px] p-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.sender === 'user' 
                            ? 'bg-green-100 text-gray-800' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        {message.isImage ? (
                          <img 
                            src={message.content} 
                            alt="Uploaded crop" 
                            className="max-w-full h-auto rounded" 
                          />
                        ) : message.content === "Thinking..." || message.content === "Analyzing your image..." ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{message.content}</span>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                            {message.content}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              
              <div className="border-t p-3 flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={triggerFileSelect}
                  disabled={isLoading}
                >
                  <Upload className="h-5 w-5 text-green-600" />
                </Button>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageSelect} 
                  accept="image/*"
                  className="hidden"
                />
                
                <Textarea
                  placeholder="Type a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[40px] resize-none"
                  rows={1}
                />
                
                <Button
                  variant="default"
                  size="icon"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSendMessage}
                  disabled={isLoading && !selectedImage}
                >
                  <Send className="h-5 w-5" />
                </Button>
                
                {selectedImage && (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={sendImageToWhatsApp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : "Analyze Image"}
                  </Button>
                )}
              </div>
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
