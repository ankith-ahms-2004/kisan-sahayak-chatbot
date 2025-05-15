
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "@/components/ChatMessage";
import SettingsDialog from "@/components/SettingsDialog";
import ApiKeyForm from "@/components/ApiKeyForm";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem("perplexity_api_key"));

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your Perplexity API key in settings",
        variant: "destructive",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    
    setIsLoading(true);
    
    try {
      // Prepare the prompt for agricultural disease analysis
      const prompt = `You are an agricultural expert assistant. A farmer has shared the following description of their crop issue: "${userMessage}"
      
      Analyze this information and provide:
      1. Possible disease identification
      2. Detailed preventive measures
      3. Treatment options (both organic and chemical if applicable)
      4. Future precautions to avoid recurrence
      
      Format your response clearly with headings and bullet points where appropriate.`;
      
      const response = await fetchPerplexityResponse(apiKey, prompt);
      
      setMessages([...newMessages, { role: "assistant", content: response }]);
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

  const fetchPerplexityResponse = async (key: string, message: string) => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural expert specializing in crop disease identification and management. Provide accurate, practical advice for farmers. Use simple language and give clear, actionable steps.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: ['perplexity.ai'],
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch response");
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
      description: "Your API key has been saved successfully",
    });
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
            <SettingsDialog apiKey={apiKey} onApiKeySave={saveApiKey} />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 flex flex-col max-w-4xl">
        {!apiKey ? (
          <Card className="p-6 my-4">
            <h2 className="text-xl font-bold mb-4">Welcome to Kisan Sahayak</h2>
            <p className="mb-4">
              This AI-powered assistant helps farmers identify crop diseases and provides preventive measures.
            </p>
            <ApiKeyForm onSave={saveApiKey} />
          </Card>
        ) : (
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
                        Describe your crop's symptoms or upload a photo to get disease identification
                        and treatment recommendations from our AI assistant.
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
                placeholder="Describe crop symptoms or issues (e.g., 'Yellow spots on wheat leaves with wilting')"
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
