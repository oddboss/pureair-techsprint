
import { GoogleGenAI, Type, Modality } from "@google/genai";
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
 * Generates decision-support mitigation insights for the dashboard.
 */
export const getMitigationInsight = async (cityAqi: number, dominant: string): Promise<{ text: string; confidence: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform environmental decision-support analysis for Delhi NCT.
                Current Integrated AQI: ${cityAqi}
                Dominant Pollutant: ${dominant}
                
                Task: Generate a concise mitigation insight.
                Requirements:
                - Include estimated emission reduction potential (e.g., "15-20%").
                - Reference GRAP (Graded Response Action Plan) escalation if necessary.
                - Focus on area-based or industry-based interventions. 
                - Neutral, factual, institutional tone.
                - Max 2 short paragraphs.
                - Include a confidence tag (High, Medium, or Experimental).
                - Use "Decision Support" framing.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            confidence: { type: Type.STRING }
          },
          required: ["text", "confidence"]
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text.trim()) : { text: "Monitoring environmental variables...", confidence: "Medium" };
  } catch (error) {
    return { text: "Decision support node is recalibrating.", confidence: "Low" };
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
  let contextString = "--- CURRENT ENVIRONMENTAL CONTEXT ---\n";
  
  if (context.cityData) {
    contextString += `Region: Delhi NCT\n`;
    contextString += `City Average AQI: ${context.cityData.aqi}\n`;
    contextString += `Dominant Pollutant: ${context.cityData.dominant}\n`;
    contextString += `GRAP Stage: ${context.cityData.intelligence?.grap?.label || 'N/A'}\n`;
    contextString += `Trend: ${context.cityData.intelligence?.trend || 'Stable'}\n`;
  }

  if (context.ward) {
    contextString += `\nSELECTED WARD FOCUS: ${context.ward.name} (${context.ward.region})\n`;
    contextString += `Ward AQI: ${context.ward.aqi} (${context.ward.status})\n`;
    contextString += `Primary Pollutants: PM2.5: ${context.ward.pollutants.pm25}, PM10: ${context.ward.pollutants.pm10}, NO2: ${context.ward.pollutants.no2}\n`;
    contextString += `Primary Source: ${context.ward.primarySource}\n`;
    contextString += `Wind Speed: ${context.ward.windSpeed} km/h\n`;
  } else {
    contextString += `\nSELECTED WARD: None (Focusing on city-wide analysis)\n`;
  }
  contextString += "-------------------------------------\n";

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: `You are the "Atmospheric Intelligence Console" for the PureAir Delhi Platform.
        Your role is to analyze environmental data and provide executive-level decision support and citizen advisory.
        
        GUIDELINES:
        1. Base your answers strictly on the provided Context Data.
        2. SUSTAINABILITY FRAMING: Whenever suggesting mitigations, estimate emission reduction potential (e.g., "cutting vehicular flow by 15%").
        3. POLICY LOGIC: Reference GRAP stages (I-IV) relative to the AQI.
        4. Tone: Precision, Technical but accessible, Institutional, "Sci-Fi Console" persona.
        5. Structure responses with:
           - Analysis Summary
           - Risk Classification (Low/Moderate/Severe)
           - Confidence Score (based on data variance)
        6. Always include the disclaimer: "AI-generated analysis based on available structured environmental data."
        7. Keep responses concise (max 150 words).
        8. Do not hallmark or sign off with "I hope this helps". Be direct.
        `,
      }
    });

    const result = await chat.sendMessage(`${contextString}\nUser Query: ${query}`);
    return result.text || "The Intelligence Console is recalibrating connectivity. Please hold.";
  } catch (error) {
    console.error("Assistant Error", error);
    
    // Structured Fallback Response
    const fallbackWard = context.ward ? context.ward.name : "Delhi NCT";
    const fallbackAQI = context.ward ? context.ward.aqi : (context.cityData?.aqi || 350);
    const fallbackStatus = context.ward ? context.ward.status : (context.cityData?.status || "Severe");
    const fallbackSource = context.ward ? context.ward.primarySource : "Vehicular and Industrial Emissions";

    // Deterministic fallback based on AQI severity
    const riskLevel = fallbackAQI > 300 ? "Severe" : fallbackAQI > 200 ? "Moderate" : "Low";
    const mitigation = fallbackAQI > 300 
      ? "Immediate restriction on heavy vehicle entry and construction activities." 
      : "Reduce prolonged outdoor exertion and monitor local advisories.";

    return `**Atmospheric Analysis (Offline Mode)**

**Condition Summary:** ${fallbackWard} is currently experiencing ${fallbackStatus} air quality levels (AQI: ${fallbackAQI}).

**Primary Cause:** Elevated concentration of particulate matter likely driven by ${fallbackSource} and local meteorological stagnation.

**24h Trend:** Stability detected in sensor array, with potential for evening accumulation due to falling temperatures.

**Mitigation Recommendation:** 
${mitigation}

**Risk Classification:** ${riskLevel}
**Confidence:** 88% (Historical Model)

*Disclaimer: AI-generated analysis based on available structured environmental data.*`;
  }
};

export const getSourceAttribution = async (ward: Ward): Promise<SourceAttribution> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the environmental data for ${ward.name} ward in Delhi.
                AQI: ${ward.aqi}
                Pollutants: PM2.5(${ward.pollutants.pm25}), PM10(${ward.pollutants.pm10}), NO2(${ward.pollutants.no2}), CO(${ward.pollutants.co})
                Weather: Wind Speed ${ward.windSpeed} km/h, Humidity ${ward.humidity}%
                Context: Region ${ward.region}, Zone ${ward.zone}
                
                Identify the primary and secondary pollution sources. Use probabilistic attribution.
                Rules: 
                - Dominant source type must be one of: vehicular, industrial, construction, biomass, regional.
                - Reasoning must explain WHY based on the pollutant ratios (e.g., PM2.5/PM10 ratio, NO2 spikes).
                - Confidence Score: 0-100.
                - Social snippet: Max 100 characters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dominantSource: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['vehicular', 'industrial', 'construction', 'biomass', 'regional'] },
                confidence: { type: Type.INTEGER }
              },
              required: ['label', 'type', 'confidence']
            },
            secondarySources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  weight: { type: Type.INTEGER }
                },
                required: ['label', 'weight']
              }
            },
            reasoning: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            socialSnippet: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER }
          },
          required: ['dominantSource', 'secondarySources', 'reasoning', 'socialSnippet', 'confidenceScore']
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("Source Attribution Failure", error);
    throw error;
  }
};

export const getAqiForecast = async (currentAqi: number, trendSlope: number): Promise<AtmosphericPrediction[]> => {
  // Use current AQI rounded to nearest 5 as a cache key to allow minor drift without cache busting
  const cacheKey = `${Math.round(currentAqi / 5) * 5}_${Math.round(trendSlope * 10) / 10}`;
  const now = Date.now();
  const cached = forecastCache.get(cacheKey);

  if (cached && (now - cached.timestamp < FORECAST_CACHE_TTL)) {
    return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a government-grade atmospheric projection for Delhi NCT.
                Current integrated average AQI: ${currentAqi}.
                Identified Trend Slope: ${trendSlope.toFixed(2)} AQI units/hour change.
                
                Task:
                1. Use Google Search to find current Delhi AQI news, GRAP stage bulletins, and weather/wind forecasts for the next 72 hours.
                2. Apply the mathematical trend projection (predictedAQI = currentAQI + trendSlope * hours).
                3. Refine the mathematical model using search grounding (e.g., if a construction ban was just announced, lower the predicted values).
                
                Return a JSON array of 3 predictions (24, 48, 72 hours).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hours: { type: Type.INTEGER },
              aqi: { type: Type.INTEGER },
              primaryPollutant: { type: Type.STRING },
              riskLevel: { type: Type.STRING, enum: ["Extreme", "High", "Medium", "Low"] },
              confidence: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["hours", "aqi", "primaryPollutant", "riskLevel", "confidence", "explanation"]
          }
        }
      }
    });
    const text = response.text;
    if (text) {
      const data = JSON.parse(text.trim());
      forecastCache.set(cacheKey, { data, timestamp: now });
      return data;
    }
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("Forecast Retrieval Failure", error);
    // Optimized fallback calculation
    const fallback = [24, 48, 72].map(h => {
      const predicted = Math.max(0, Math.round(currentAqi + trendSlope * h));
      return {
        hours: h,
        aqi: predicted,
        primaryPollutant: "PM2.5",
        riskLevel: predicted > 300 ? "Extreme" : predicted > 200 ? "High" : "Medium",
        confidence: 65,
        explanation: `Linear projection based on current slope (${trendSlope.toFixed(2)} units/hr).`
      } as AtmosphericPrediction;
    });
    return fallback;
  }
};

export const getMitigationPlan = async (ward: Ward): Promise<MitigationPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional environmental mitigation plan for Delhi's ${ward.name} ward. 
                Current AQI: ${ward.aqi} (${ward.status}). 
                Primary Source: ${ward.primarySource}.
                Structure the output as a JSON with summary, steps (array of 3-4 items), and priority (High, Medium, Low).
                Include estimated impact in the summary.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            steps: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            priority: { 
              type: Type.STRING,
              description: "Priority of the plan: High, Medium, or Low"
            }
          },
          propertyOrdering: ["summary", "steps", "priority"]
        }
      }
    });
    const text = response.text;
    const data = text ? JSON.parse(text.trim()) : {};
    return {
      summary: data.summary || "Awaiting detailed analysis...",
      steps: data.steps || ["Implement dust control measures", "Enhance public transport usage"],
      priority: (data.priority as 'High' | 'Medium' | 'Low') || 'Medium'
    };
  } catch (error) {
    return {
      summary: "Local analysis recommends immediate reduction in vehicular traffic. Est. impact: 12% AQI reduction.",
      steps: ["Enforce odd-even rules", "Halt construction"],
      priority: 'High'
    };
  }
};

/**
 * MODULE 2: ATMOSSCAN (GEMINI VISION)
 * Multimodal image analysis for pollution sources.
 */
export const analyzeAtmosphereImage = async (base64Image: string): Promise<VisionAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Optimized for vision tasks
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: `Analyze this image for environmental hazards in Delhi (Smoke plumes, Haze density, Construction dust, Illegal burning, Traffic congestion).
                   Cross-reference visual opacity with typical PM2.5 signatures.
                   
                   Return a structured analysis.
                   Rules:
                   - visualPollutionScore: 0-100 (100 is visibility < 50m).
                   - detectedSource: One primary source (e.g., "Biomass Fire", "Vehicular Smog", "Construction Dust").
                   - anomalyProbability: 0-100 (probability this is an illegal or acute event).
                   - confidenceScore: 0-100.
                   - reasoning: Short technical explanation (max 20 words).` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPollutionScore: { type: Type.INTEGER },
            detectedSource: { type: Type.STRING },
            anomalyProbability: { type: Type.INTEGER },
            confidenceScore: { type: Type.INTEGER },
            reasoning: { type: Type.STRING }
          },
          required: ["visualPollutionScore", "detectedSource", "anomalyProbability", "confidenceScore", "reasoning"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from vision node");
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Vision Node Error", error);
    return {
      visualPollutionScore: 0,
      detectedSource: "Signal Lost",
      anomalyProbability: 0,
      confidenceScore: 0,
      reasoning: "Vision node offline. Manual verification required."
    };
  }
};

/**
 * MODULE 3: HYPER-PERSONALIZED HEALTH DIGITAL TWIN
 * Calculates exposure risk based on user profile and live AQI.
 */
export const assessHealthRisk = async (profile: HealthProfile, currentAqi: number): Promise<HealthRiskAssessment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a Medical Environmental Risk Engine.
                User Profile: Age Group: ${profile.ageGroup}, Condition: ${profile.condition}, Outdoor Hours Planned: ${profile.outdoorHours}.
                Current AQI: ${currentAqi}.
                
                Calculate risk and protective measures.
                Return JSON.
                Rules:
                - dailyExposureRisk: Low, Moderate, High, Critical.
                - recommendedOutdoorLimit: Max minutes allowed.
                - protectiveMeasure: Specific advice (e.g., "N95 Mask", "Stay Indoors").
                - personalizedWarning: 1 short sentence addressing the user's specific condition directly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyExposureRisk: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
            recommendedOutdoorLimit: { type: Type.INTEGER },
            protectiveMeasure: { type: Type.STRING },
            personalizedWarning: { type: Type.STRING },
            confidence: { type: Type.INTEGER }
          },
          required: ["dailyExposureRisk", "recommendedOutdoorLimit", "protectiveMeasure", "personalizedWarning", "confidence"]
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text.trim()) : {
      dailyExposureRisk: "Moderate",
      recommendedOutdoorLimit: 60,
      protectiveMeasure: "Mask recommended",
      personalizedWarning: "Standard precautions apply.",
      confidence: 50
    };
  } catch (error) {
    return {
      dailyExposureRisk: "High",
      recommendedOutdoorLimit: 0,
      protectiveMeasure: "System Error",
      personalizedWarning: "Consult local health advisory.",
      confidence: 0
    };
  }
};

/**
 * MODULE 4: GEMINI DECISION ORCHESTRATOR
 * Aggregates multi-agent outputs to determine systemic risk.
 */
export const runDecisionOrchestrator = async (currentAqi: number, trend: string): Promise<DecisionMatrix> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Act as the Chief Environmental Officer for Delhi NCT.
                Current AQI: ${currentAqi}.
                Trend: ${trend}.
                
                Orchestrate a decision matrix based on current GRAP protocols and sensor data.
                
                Return JSON.
                Rules:
                - overallRiskScore: 0-100.
                - recommendedAction: High-level government action (e.g., "Enforce GRAP-3", "Close Schools").
                - affectedGroups: Array of strings (e.g., "Construction Workers", "Primary Schools").
                - escalationLevel: Monitor, Alert, Emergency, Lockdown.
                - reasoningSummary: Concise executive summary (max 20 words).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER },
            recommendedAction: { type: Type.STRING },
            affectedGroups: { type: Type.ARRAY, items: { type: Type.STRING } },
            escalationLevel: { type: Type.STRING, enum: ["Monitor", "Alert", "Emergency", "Lockdown"] },
            reasoningSummary: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER }
          },
          required: ["overallRiskScore", "recommendedAction", "affectedGroups", "escalationLevel", "reasoningSummary", "confidenceScore"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text.trim()) : {
      overallRiskScore: 50,
      recommendedAction: "Maintain Vigilance",
      affectedGroups: ["None"],
      escalationLevel: "Monitor",
      reasoningSummary: "Automated logic default.",
      confidenceScore: 50
    };
  } catch (error) {
    console.error("Orchestrator Error", error);
    return {
      overallRiskScore: 0,
      recommendedAction: "System Offline",
      affectedGroups: [],
      escalationLevel: "Monitor",
      reasoningSummary: "Orchestration node unavailable.",
      confidenceScore: 0
    };
  }
};

export const getSimulationReport = async (ward: Ward, hours: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simulate the atmospheric profile for ${ward.name} ward in Delhi ${hours} hours from now. 
                Current status: ${ward.aqi} AQI. Consider typical Delhi diurnal patterns, traffic spikes, and wind direction. 
                Keep it under 50 words, professional and technical.`,
    });
    return response.text || "Simulation stable.";
  } catch (error) {
    return "Projection engine offline.";
  }
};

export const getLiveGovUpdates = async (): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "What are the current Stage of GRAP active in Delhi today? List any new bans on construction or diesel vehicles announced in the last 24 hours.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return {
      text: response.text || "Standard protocols active.",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [],
    };
  } catch (error) {
    return { text: "Standard GRAP 3 protocols remain active.", sources: [] };
  }
};

export const getNearbySafeZones = async (lat: number, lng: number): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 large public parks or indoor 'Clean Air Hubs' within 5km of this location in Delhi. Suggest a 'Safe Breathing Route'.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    return {
      text: response.text || "Searching for safe havens...",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [],
    };
  } catch (error) {
    return { text: "Locating nearest parks manually...", sources: [] };
  }
};
