
import { Message } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg p-3 max-w-[80%]",
          isUser
            ? "bg-green-600 text-white"
            : "bg-white border border-gray-200 shadow-sm"
        )}
      >
        <div
          className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "")}
          dangerouslySetInnerHTML={{ 
            __html: formatMessage(message.content)
          }}
        />
      </div>
    </div>
  );
};

// Function to format message with Markdown-like syntax
const formatMessage = (text: string) => {
  // Convert line breaks
  let formattedText = text.replace(/\n/g, "<br>");
  
  // Format headings
  formattedText = formattedText.replace(/## (.*?)(\n|$)/g, "<h3>$1</h3>");
  formattedText = formattedText.replace(/# (.*?)(\n|$)/g, "<h2>$1</h2>");
  
  // Format bold text
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Format lists
  formattedText = formattedText.replace(/- (.*?)(\n|$)/g, "• $1<br>");
  
  return formattedText;
};

export default ChatMessage;
