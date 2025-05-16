import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "@/components/ChatMessage";
import SettingsDialog from "@/components/SettingsDialog";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import GeminiApiKeyForm from "@/components/GeminiApiKeyForm";
import { AnalysisResult, analyzeImageWithGemini, analyzeTextWithGemini, DEFAULT_GEMINI_API_KEY } from "@/utils/geminiApi";

// Default Gemini API key
const DEFAULT_GEMINI_API_KEY = "AIzaSyAgliKnRhVVdoW-2bgMFcvN4fMYLSBSqJ0";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem("perplexity_api_key"));
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(
    localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_API_KEY
  );
  const [activeTab, setActiveTab] = useState<"text" | "whatsapp">("text");

  // Clear user data when component unmounts or tab/window closes
  useEffect(() => {
    // Save the current API keys
    const savedGeminiKey = geminiApiKey;
    
    const handleUnload = () => {
      // Remove user messages from localStorage - keeping only API keys
      localStorage.removeItem("user_messages");
      
      // Restore just the API keys
      if (savedGeminiKey) {
        localStorage.setItem("gemini_api_key", savedGeminiKey);
      }
      if (apiKey) {
        localStorage.setItem("perplexity_api_key", apiKey);
      }
    };
    
    window.addEventListener("beforeunload", handleUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [geminiApiKey, apiKey]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Use default API key if not set
    const apiKeyToUse = geminiApiKey || DEFAULT_GEMINI_API_KEY;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    
    setIsLoading(true);
    
    try {
      // Use Gemini API for text analysis
      const analysisResult = await analyzeTextWithGemini(userMessage, apiKeyToUse);
      
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
      
      setMessages([...newMessages, { role: "assistant" as const, content: formattedResponse }]);
    } catch (error) {
      console.error("Error fetching response:", error);
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

  const saveApiKey = (key: string) => {
    localStorage.setItem("perplexity_api_key", key);
    setApiKey(key);
    toast({
      title: "API Key Saved",
      description: "Your Perplexity API key has been saved successfully",
    });
  };

  const saveGeminiApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setGeminiApiKey(key);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved successfully",
    });
  };

  const handleImageAnalysis = async (imageBase64: string) => {
    // Use default API key if not set
    const apiKeyToUse = geminiApiKey || DEFAULT_GEMINI_API_KEY;
    
    setIsLoading(true);
    
    // Add a placeholder for the user's image message
    const userMessage: Message = {
      role: "user",
      content: "I've uploaded an image of my crop for analysis."
    };
    
    setMessages([...messages, userMessage]);
    
    try {
      const analysisResult: AnalysisResult = await analyzeImageWithGemini(imageBase64, apiKeyToUse);
      
      // Format the analysis result into a readable message
      const formattedResponse = `
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
      
      setMessages(current => [...current, { 
        role: "assistant", 
        content: formattedResponse 
      }]);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again with a clearer image.",
        variant: "destructive",
      });
      
      setMessages(current => [...current, { 
        role: "assistant", 
        content: "I couldn't analyze the image properly. Please make sure the image is clear and shows the affected plant parts well." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-green-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            Kisan Sahayak
            <span className="text-sm ml-2 font-normal hidden sm:inline">
              (Farmer's Helper)
            </span>
          </h1>
          <div className="flex items-center space-x-2">
            <SettingsDialog 
              apiKey={apiKey} 
              geminiApiKey={geminiApiKey || DEFAULT_GEMINI_API_KEY} 
              onApiKeySave={saveApiKey} 
              onGeminiApiKeySave={saveGeminiApiKey} 
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 flex flex-col max-w-4xl">
        {(!geminiApiKey && !DEFAULT_GEMINI_API_KEY) ? (
          <Card className="p-6 my-4">
            <h2 className="text-xl font-bold mb-4">Welcome to Kisan Sahayak</h2>
            <p className="mb-4">
              This AI-powered assistant helps farmers identify crop diseases and provides preventive measures.
            </p>
            <div className="space-y-8">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Text & Image Analysis with Gemini AI</h3>
                <GeminiApiKeyForm onSave={saveGeminiApiKey} />
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex space-x-4 mb-4">
              <Button
                variant={activeTab === "text" ? "default" : "outline"}
                className={activeTab === "text" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setActiveTab("text")}
              >
                Text Chat
              </Button>
              <Button
                variant={activeTab === "whatsapp" ? "default" : "outline"}
                className={activeTab === "whatsapp" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setActiveTab("whatsapp")}
              >
                WhatsApp Integration
              </Button>
            </div>

            {activeTab === "text" ? (
              <>
                <Card className="flex-1 mb-4 overflow-hidden">
                  <ScrollArea className="h-[60vh]">
                    <div className="p-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                          <img
                            src="/lovable-uploads/3cdf4985-15f5-4462-b92c-b9447f6f13ad.png"
                            alt="Agricultural technology"
                            className="w-64 h-auto mb-4 rounded-lg opacity-70"
                          />
                          <h2 className="text-xl font-bold text-green-800 mb-2">
                            Welcome to Kisan Sahayak
                          </h2>
                          <p className="text-gray-600 max-w-md">
                            Describe your crop's symptoms or ask any farming questions to get disease identification,
                            treatment recommendations, and advice from our AI assistant.
                          </p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <ChatMessage key={index} message={message} />
                        ))
                      )}
                      {isLoading && (
                        <div className="flex items-center text-gray-500 p-4">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                <div className="relative">
                  <Textarea
                    placeholder="Ask any farming questions or describe crop symptoms (e.g., 'Yellow spots on wheat leaves with wilting' or 'What's the best time to plant tomatoes?')"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    className="pr-12 resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <WhatsAppIntegration defaultApiKey={DEFAULT_GEMINI_API_KEY} />
            )}
          </>
        )}
      </main>

      <footer className="bg-green-800 text-white p-4 text-center text-sm">
        <div className="container mx-auto">
          <p>
            Kisan Sahayak - AI-Powered Crop Disease Analysis Tool
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
