import { GoogleGenAI } from "@google/genai";
import { 
  Ward, 
  MitigationPlan, 
  GroundingChunk, 
  AtmosphericPrediction, 
  SourceAttribution,
  VisionAnalysisResult,
  HealthProfile,
  HealthRiskAssessment,
  DecisionMatrix,
  LiveAqiData
} from "../types";

// Forecast Cache TTL: 15 minutes
const FORECAST_CACHE_TTL = 15 * 60 * 1000;
const forecastCache: Map<string, { data: AtmosphericPrediction[]; timestamp: number }> = new Map();

/**
 * Helper to safely parse JSON from LLM text responses which might contain Markdown formatting.
 */
const cleanAndParseJSON = (text: string | undefined): any => {
  if (!text) return null;
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Manual JSON Parse Failed", e);
    return null;
  }
};

/**
 * Generates decision-support mitigation insights for the dashboard.
 */
export const getMitigationInsight = async (cityAqi: number, dominant: string): Promise<{ text: string; confidence: string }> => {
  // Use new GoogleGenAI instance for fresh config
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format (string for simple prompts)
      contents: `Perform environmental decision-support analysis for Delhi NCT.
                Current Integrated AQI: ${cityAqi}
                Dominant Pollutant: ${dominant}
                
                Task: Generate a concise mitigation insight.
                Requirements:
                - Include estimated emission reduction potential (e.g., "15-20%").
                - Reference GRAP (Graded Response Action Plan) escalation if necessary.
                - Max 2 short paragraphs.
                - Include a confidence tag (High, Medium, or Experimental).
                
                OUTPUT: Return ONLY a JSON object with keys "text" and "confidence". Do not use Markdown blocks.`
    });
    
    const data = cleanAndParseJSON(response.text);
    return data || { text: "Intelligence node active. Awaiting fresh data streams...", confidence: "Medium" };
  } catch (error) {
    return { text: "Environmental reasoning engine temporarily unavailable.", confidence: "Low" };
  }
};

export interface ChatContext {
  ward?: Ward | null;
  cityData?: LiveAqiData | null;
}

export const getAssistantResponse = async (
  query: string, 
  context: ChatContext,
  history: { role: 'user' | 'model', parts: { text: string }[] }[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct environmental context string
  let contextString = "--- LIVE ATMOSPHERIC DATA ---\n";
  if (context.cityData) {
    contextString += `City AQI: ${context.cityData.aqi}\n`;
    contextString += `GRAP Stage: ${context.cityData.intelligence?.grap?.label || 'IV'}\n`;
  }
  if (context.ward) {
    contextString += `Selected Ward: ${context.ward.name}\n`;
    contextString += `Ward AQI: ${context.ward.aqi}\n`;
  }
  contextString += "------------------------------\n";

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: `You are the Delhi Atmospheric Intelligence Assistant.
Only answer about:
- AQI and pollution metrics
- Health impacts of air quality
- Delhi temperature and weather
- GRAP (Graded Response Action Plan) stages
- Government environmental policies
- Emission reduction strategies

Operational Rules:
- Use the live data provided in the context.
- Maintain an authoritative, structured tone.
- Do NOT hallucinate "Offline Mode" responses.
- If the query is outside these topics, politely redirect.`,
      }
    });

    const result = await chat.sendMessage({
      message: `${contextString}\nUser Query: ${query}`
    });
    
    return result.text || "Connection unstable. Retrying link...";
  } catch (error) {
    console.error("Assistant Error", error);
    return "Live AI connection error. Please try again in a few moments.";
  }
};

export const getSourceAttribution = async (ward: Ward): Promise<SourceAttribution> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Analyze environmental data for ${ward.name} ward.
                AQI: ${ward.aqi}
                Pollutants: PM2.5(${ward.pollutants.pm25}), PM10(${ward.pollutants.pm10}), NO2(${ward.pollutants.no2})
                
                Identify primary/secondary pollution sources.
                
                OUTPUT: Return ONLY a JSON object:
                {
                  "dominantSource": { "label": "string", "type": "vehicular"|"industrial"|"construction"|"biomass"|"regional", "confidence": number },
                  "secondarySources": [{ "label": "string", "weight": number }],
                  "reasoning": ["string", "string"],
                  "socialSnippet": "string",
                  "confidenceScore": number
                }`
    });
    
    const data = cleanAndParseJSON(response.text);
    if (!data) throw new Error("Parse Failure");
    return data;
  } catch (error) {
    throw new Error("Source attribution link failed.");
  }
};

export const getAqiForecast = async (currentAqi: number, trendSlope: number): Promise<AtmosphericPrediction[]> => {
  const cacheKey = `forecast_${currentAqi}_${trendSlope}`;
  const now = Date.now();
  if (forecastCache.has(cacheKey)) {
    const cached = forecastCache.get(cacheKey)!;
    if (now - cached.timestamp < FORECAST_CACHE_TTL) return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Atmospheric projection for Delhi NCT. Current AQI: ${currentAqi}. Trend Slope: ${trendSlope}.
                Generate 3 predictions (24, 48, 72 hours).
                
                OUTPUT: Return ONLY a JSON array of objects:
                { hours: number, aqi: number, primaryPollutant: string, riskLevel: string, confidence: number, explanation: string }`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const data = cleanAndParseJSON(response.text);
    if (data && Array.isArray(data)) {
      forecastCache.set(cacheKey, { data, timestamp: now });
      return data;
    }
    throw new Error("Invalid Format");
  } catch (error) {
    return [24, 48, 72].map(h => ({
      hours: h, aqi: Math.max(0, Math.round(currentAqi + trendSlope * h)),
      primaryPollutant: "PM2.5", riskLevel: "High", confidence: 50, explanation: "Linear projection (AI model link failed)."
    })) as AtmosphericPrediction[];
  }
};

export const getMitigationPlan = async (ward: Ward): Promise<MitigationPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Environmental mitigation plan for ${ward.name} ward (AQI: ${ward.aqi}).
                OUTPUT: Return ONLY a JSON object: { summary: string, steps: string[], priority: "High"|"Medium"|"Low" }`
    });
    
    const data = cleanAndParseJSON(response.text);
    return data || { summary: "Awaiting analysis...", steps: ["Monitor local sensors"], priority: 'Medium' };
  } catch (error) {
    return { summary: "Live strategy link failed.", steps: ["Refer to standard GRAP protocols"], priority: 'High' };
  }
};

export const analyzeAtmosphereImage = async (base64Image: string): Promise<VisionAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      // Fix: Follow @google/genai guideline for multi-part (image + text) contents format
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Analyze pollution visibility in this image.
                   OUTPUT: Return ONLY a JSON object:
                   { visualPollutionScore: number, detectedSource: string, anomalyProbability: number, confidenceScore: number, reasoning: string }`,
          },
        ],
      },
    });
    
    const data = cleanAndParseJSON(response.text);
    if (!data) throw new Error("Vision Analysis Failure");
    return data;
  } catch (error) {
    return {
      visualPollutionScore: 0,
      detectedSource: "Analysis Interrupted",
      anomalyProbability: 0,
      confidenceScore: 0,
      reasoning: "Vision processing link failed. Please retry."
    };
  }
};

export const assessHealthRisk = async (profile: HealthProfile, currentAqi: number): Promise<HealthRiskAssessment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Calculate health risk. Profile: ${profile.ageGroup}, ${profile.condition}. AQI: ${currentAqi}.
                OUTPUT: Return ONLY a JSON object:
                { dailyExposureRisk: string, recommendedOutdoorLimit: number, protectiveMeasure: string, personalizedWarning: string, confidence: number }`
    });
    
    const data = cleanAndParseJSON(response.text);
    return data || { dailyExposureRisk: "High", recommendedOutdoorLimit: 0, protectiveMeasure: "Stay Indoors", personalizedWarning: "Analysis failed.", confidence: 0 };
  } catch (error) {
    return { dailyExposureRisk: "High", recommendedOutdoorLimit: 0, protectiveMeasure: "System Error", personalizedWarning: "Risk assessment engine offline.", confidence: 0 };
  }
};

export const runDecisionOrchestrator = async (currentAqi: number, trend: string): Promise<DecisionMatrix> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Environmental Risk Orchestrator. AQI: ${currentAqi}, Trend: ${trend}.
                OUTPUT: Return ONLY a JSON object:
                { overallRiskScore: number, recommendedAction: string, affectedGroups: string[], escalationLevel: string, reasoningSummary: string, confidenceScore: number }`
    });

    const data = cleanAndParseJSON(response.text);
    return data || { overallRiskScore: 0, recommendedAction: "N/A", affectedGroups: [], escalationLevel: "Monitor", reasoningSummary: "Orchestration failed.", confidenceScore: 0 };
  } catch (error) {
    return { overallRiskScore: 0, recommendedAction: "System Offline", affectedGroups: [], escalationLevel: "Monitor", reasoningSummary: "Decision engine link failed.", confidenceScore: 0 };
  }
};

export const getSimulationReport = async (ward: Ward, hours: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: `Simulate atmosphere for ${ward.name} in ${hours} hours. AQI: ${ward.aqi}. Limit: 40 words.`
    });
    return response.text || "Simulation uplink stable.";
  } catch (error) {
    return "Projection engine link failed.";
  }
};

export const getLiveGovUpdates = async (): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: "Current Stage of GRAP active in Delhi today? List new bans or policy shifts in 24h.",
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text || "GRAP monitoring online.",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [],
    };
  } catch (error) {
    return { text: "Policy uplink failed. Refer to CPCB official site.", sources: [] };
  }
};

export const getNearbySafeZones = async (lat: number, lng: number): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // Fix: Follow @google/genai guideline for simplified contents format
      contents: "Find 3 large public parks or indoor 'Clean Air Hubs' within 5km. Recommend safe route.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      },
    });
    return {
      text: response.text || "Mapping safe zones...",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [],
    };
  } catch (error) {
    return { text: "Safe zone mapping link failed.", sources: [] };
  }
};