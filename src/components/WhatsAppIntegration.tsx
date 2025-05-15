
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, QrCode, Send } from "lucide-react";
import { useState, useEffect } from "react";

const WhatsAppIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const whatsappNumber = "8618384071";

  const connectToWhatsApp = () => {
    // In a production environment, this would involve actual WhatsApp Business API integration
    // For demo purposes, we're simulating a connection
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
