
// Interface for analysis results
export interface AnalysisResult {
  disease: string;
  confidence?: number;
  description: string;
  preventiveMeasures: string[];
  treatment: string;
  precautions: string[];
}

/**
 * Analyzes an image using the Gemini API to identify crop diseases
 * @param imageBase64 Base64 encoded image data
 * @param apiKey Gemini API key
 * @returns Analysis result with disease identification and recommendations
 */
export const analyzeImageWithGemini = async (
  imageBase64: string,
  apiKey: string
): Promise<AnalysisResult> => {
  try {
    // Remove the data URL prefix if present
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "You are an agricultural expert specialized in identifying crop diseases. Analyze this crop image and provide: 1) Disease name, 2) Detailed description, 3) Preventive measures, 4) Treatment options, 5) Future precautions. Format your response as JSON with the following structure: {\"disease\": \"...\", \"description\": \"...\", \"preventiveMeasures\": [\"...\"], \"treatment\": \"...\", \"precautions\": [\"...\"]}. Please ensure the response is valid JSON."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    // The API might sometimes wrap JSON in markdown code blocks or add additional text
    let jsonStr = textResponse;
    
    // Try to extract JSON if wrapped in code blocks
    const jsonMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Parse the JSON response
    const analysisResult: AnalysisResult = JSON.parse(jsonStr);
    
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    // Return a fallback response for error cases
    return {
      disease: "Analysis Error",
      description: "Unable to analyze the image. Please ensure the image is clear and try again.",
      preventiveMeasures: ["Ensure good lighting when taking photos", "Focus the camera on the affected area"],
      treatment: "Please try again with a clearer image or provide additional details about the crop symptoms.",
      precautions: ["Try different angles", "Include both healthy and affected parts in the image"]
    };
  }
};
