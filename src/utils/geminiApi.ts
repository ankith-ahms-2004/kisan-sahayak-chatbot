
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
 * Validates that the provided API key is properly formatted
 * @param apiKey API key to validate
 * @returns Boolean indicating if the key appears valid
 */
const validateApiKey = (apiKey: string): boolean => {
  // Simple validation - Gemini API keys typically have a minimum length
  // This is just a basic check and doesn't guarantee the key works
  return apiKey && apiKey.trim().length > 20;
};

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
    if (!validateApiKey(apiKey)) {
      throw new Error("Invalid API key format");
    }

    // Remove the data URL prefix if present
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    console.log("Making request to Gemini API...");
    
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
      const errorData = await response.json();
      console.error("Gemini API error response:", errorData);
      
      // More specific error based on API response
      if (errorData?.error?.message?.includes("API key")) {
        throw new Error("Invalid API key. Please check your Gemini API key in settings.");
      }
      throw new Error(`Gemini API error: ${response.status}. ${errorData?.error?.message || ''}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API");
    }
    
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    // The API might sometimes wrap JSON in markdown code blocks or add additional text
    let jsonStr = textResponse;
    
    // Try to extract JSON if wrapped in code blocks
    const jsonMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    
    try {
      // Parse the JSON response
      const analysisResult: AnalysisResult = JSON.parse(jsonStr);
      
      // Validate the required fields
      if (!analysisResult.disease || !analysisResult.description || 
          !Array.isArray(analysisResult.preventiveMeasures) || 
          !analysisResult.treatment || 
          !Array.isArray(analysisResult.precautions)) {
        throw new Error("Incomplete response from API");
      }
      
      return analysisResult;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Could not parse the response from Gemini. Try again with a clearer image.");
    }
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    // Return a fallback response for error cases with more specific information
    return {
      disease: "Analysis Error",
      description: error instanceof Error ? error.message : "Unknown error occurred during analysis.",
      preventiveMeasures: [
        "Ensure your API key is correctly set in settings", 
        "Try with a clearer image with good lighting",
        "Focus the camera directly on the affected plant parts"
      ],
      treatment: "Please verify your API key is valid and try again with a clearer image.",
      precautions: [
        "Use a valid Gemini API key",
        "Include both healthy and affected parts in the image for better comparison", 
        "Take multiple photos from different angles if needed"
      ]
    };
  }
};

/**
 * Analyzes text description using the Gemini API to identify crop diseases
 * @param textQuery User's text description of crop symptoms
 * @param apiKey Gemini API key
 * @returns Analysis result with disease identification and recommendations
 */
export const analyzeTextWithGemini = async (
  textQuery: string,
  apiKey: string
): Promise<AnalysisResult> => {
  try {
    if (!validateApiKey(apiKey)) {
      throw new Error("Invalid API key format");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are an agricultural expert specialized in identifying crop diseases. 
              A farmer has described the following issue: "${textQuery}"
              
              Based on this description, provide:
              1) Likely disease name
              2) Detailed description of the disease
              3) Preventive measures
              4) Treatment options
              5) Future precautions
              
              Format your response as JSON with the following structure:
              {
                "disease": "Disease name",
                "description": "Detailed description",
                "preventiveMeasures": ["Measure 1", "Measure 2", ...],
                "treatment": "Detailed treatment options",
                "precautions": ["Precaution 1", "Precaution 2", ...]
              }
              
              Please ensure the response is valid JSON.`
            }
          ]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error response:", errorData);
      
      // More specific error based on API response
      if (errorData?.error?.message?.includes("API key")) {
        throw new Error("Invalid API key. Please check your Gemini API key in settings.");
      }
      throw new Error(`Gemini API error: ${response.status}. ${errorData?.error?.message || ''}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    let jsonStr = textResponse;
    
    // Try to extract JSON if wrapped in code blocks
    const jsonMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    
    try {
      // Parse the JSON response
      const analysisResult: AnalysisResult = JSON.parse(jsonStr);
      return analysisResult;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Could not parse the response from Gemini.");
    }
  } catch (error) {
    console.error("Error analyzing text with Gemini:", error);
    return {
      disease: "Analysis Error",
      description: error instanceof Error ? error.message : "Unable to analyze your description.",
      preventiveMeasures: ["Ensure your API key is correctly set in settings", "Provide more specific details about symptoms"],
      treatment: "Please verify your API key is valid and try again with more details.",
      precautions: ["Use a valid Gemini API key", "Mention the crop type", "Describe environmental conditions"]
    };
  }
};
