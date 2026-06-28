import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your Secrets in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Prompt schema for structured JSON output
const travelItinerarySchema = {
  type: Type.OBJECT,
  properties: {
    tripSummary: {
      type: Type.STRING,
      description: "A short, engaging introductory sentence tailored to the user's companion and destination choice.",
    },
    destinationImageUrl: {
      type: Type.STRING,
      description: "A valid, public high-quality Unsplash image URL showing a key landmark of the destination. Must start with https://images.unsplash.com/photo-",
    },
    overallLocation: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING, description: "City or region name" },
        country: { type: Type.STRING, description: "Country name" },
        bestSeason: { type: Type.STRING, description: "Best season or months to visit (e.g. 'Late Spring to Early Autumn')" },
        weatherSummary: { type: Type.STRING, description: "Brief description of the weather (e.g. 'Mild, sunny, with occasional light sea breezes')" },
      },
      required: ["city", "country", "bestSeason", "weatherSummary"],
    },
    estimatedBudget: {
      type: Type.OBJECT,
      properties: {
        totalEstimatedCost: { type: Type.STRING, description: "Total estimated cost string for the whole trip in INR (e.g., '₹15,000 - ₹22,000')" },
        currency: { type: Type.STRING, description: "Currency symbol or code, must be 'INR (₹)'" },
        breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Budget category name (e.g., 'Accommodation', 'Food & Dining', 'Activities', 'Local Transport')" },
              cost: { type: Type.STRING, description: "Estimated cost or range in INR (e.g., '₹6,000')" },
              percentage: { type: Type.INTEGER, description: "Approximate percentage of total budget (e.g., 40)" },
            },
            required: ["category", "cost", "percentage"],
          },
        },
      },
      required: ["totalEstimatedCost", "currency", "breakdown"],
    },
    hotels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hotelName: { type: Type.STRING, description: "Name of the hotel matching the budget" },
          address: { type: Type.STRING, description: "Full street address, city, country" },
          priceRange: { type: Type.STRING, description: "Estimated cost string in INR (e.g., '₹3,500/night')" },
          rating: { type: Type.NUMBER, description: "Rating from 1.0 to 5.0" },
          geoCoordinates: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER, description: "Latitude coordinates of the hotel" },
              lng: { type: Type.NUMBER, description: "Longitude coordinates of the hotel" },
            },
            required: ["lat", "lng"],
          },
          description: { type: Type.STRING, description: "Brief description of why this hotel fits their profile." },
          imageUrl: {
            type: Type.STRING,
            description: "A valid, high-quality public Unsplash image URL representing a stylish hotel lobby, room, or facade. Must start with https://images.unsplash.com/photo-",
          },
        },
        required: ["hotelName", "address", "priceRange", "rating", "geoCoordinates", "description", "imageUrl"],
      },
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER, description: "Sequential day number (e.g., 1, 2, 3)" },
          bestTimeForArrival: { type: Type.STRING, description: "Suggested timing note (e.g., 'Afternoon for arrival and checking in')" },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                placeName: { type: Type.STRING, description: "Name of attraction, restaurant, or hidden gem" },
                placeDetails: { type: Type.STRING, description: "2-3 sentences explaining what to do there, tailoring the vibe specifically to the companion type." },
                ticketPricing: { type: Type.STRING, description: "Estimated cost or entry fee detail in INR (e.g., 'Free entry', '₹500 per person')" },
                geoCoordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER, description: "Latitude coordinates of the activity" },
                    lng: { type: Type.NUMBER, description: "Longitude coordinates of the activity" },
                  },
                  required: ["lat", "lng"],
                },
                imageUrl: {
                  type: Type.STRING,
                  description: "A valid, high-quality public Unsplash image URL representing this specific attraction or vibe. Must start with https://images.unsplash.com/photo-",
                },
              },
              required: ["placeName", "placeDetails", "ticketPricing", "geoCoordinates", "imageUrl"],
            },
          },
        },
        required: ["dayNumber", "bestTimeForArrival", "activities"],
      },
    },
  },
  required: ["tripSummary", "destinationImageUrl", "overallLocation", "estimatedBudget", "hotels", "itinerary"],
};

// Helper to execute generateContent with exponential backoff and model fallback (e.g. to handle 503 errors)
async function generateContentWithRetryAndFallback(
  prompt: string,
  systemInstruction: string,
  schema: any
) {
  const ai = getAiClient();
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-3.1-flash-lite"];
  const maxRetries = 2; // number of retries per model

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1.5s, 3s, 6s...
          const delay = Math.round(Math.pow(2, attempt) * 1500);
          console.warn(`[Gemini API] Retrying model "${model}" (attempt ${attempt}/${maxRetries}) in ${delay}ms due to transient error...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        console.log(`[Gemini API] Generating content with model: "${model}", attempt: ${attempt}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7,
          },
        });

        if (response.text) {
          console.log(`[Gemini API] Success using model: "${model}" on attempt: ${attempt}`);
          return response;
        }
        throw new Error(`Empty response text returned from model "${model}".`);
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini API] Error on model "${model}" (attempt ${attempt}):`, err.message || err);

        // Analyze if the error is non-transient (e.g., 400 Bad Request, invalid API key, invalid schema)
        const errMsg = (err.message || "").toLowerCase();
        const isTransient = 
          errMsg.includes("503") || 
          errMsg.includes("unavailable") || 
          errMsg.includes("demand") || 
          errMsg.includes("rate limit") ||
          errMsg.includes("rate-limit") ||
          errMsg.includes("rate_limit") ||
          errMsg.includes("resource exhausted") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("quota") ||
          errMsg.includes("429") ||
          errMsg.includes("500") ||
          errMsg.includes("internal") ||
          errMsg.includes("timeout");

        // If it's not transient, or if we hit a hard quota limits on the first attempt,
        // we can immediately try the next model instead of wasting retries on a model we know has no quota left.
        const isHardQuotaExceeded = errMsg.includes("quota exceeded") || errMsg.includes("429") || errMsg.includes("resource_exhausted");
        if ((!isTransient || isHardQuotaExceeded) && attempt === 0) {
          console.warn(`[Gemini API] Hard quota or non-transient error detected for "${model}". Skipping further retries for this model and attempting next fallback...`);
          break; // break the retry loop, proceed to next model
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate itinerary after trying multiple models and retries.");
}

// Travel Itinerary generation endpoint
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, companionType, budget, duration } = req.body;

    if (!destination || !companionType || !budget || !duration) {
      res.status(400).json({ error: "Missing required request parameters (destination, companionType, budget, duration)" });
      return;
    }

    const systemInstruction = `You are an expert AI Travel Assistant designed to generate structured, highly personalized travel itineraries with beautiful imagery, detailed locations, and estimated budgets.
Ensure that if "A Couple" is selected, the descriptions and hidden gems skew romantic and elegant.
If "Family" is selected, focus on kid-friendly paces and interactive attractions.
If "Friends" is selected, focus on social activities, nightlife, group photos, and exciting spots.
If "Just Me" is selected, focus on immersive solo exploration, safety, relaxation, and local interactions.

Provide real, realistic latitude and longitude coordinates for all hotels and activities in the chosen destination (${destination}) so that they can be plotted accurately on a mapping canvas.

For destinationImageUrl, hotels[].imageUrl, and activities[].imageUrl, you MUST provide real, high-quality, valid public Unsplash image URLs (e.g., 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80' for Paris, or similar real photos from your knowledge base of the destination, stylish hotels, and tourist attractions). Always choose a beautiful photo that represents the specific place, hotel, or activity. Every URL must start with 'https://images.unsplash.com/photo-'.

For estimatedBudget, calculate realistic estimated pricing for the destination and chosen budget category in Indian Rupees (INR, ₹). Ensure the totalEstimatedCost represents the cumulative total for the exact number of days (${duration}). For example, if the trip is 3 Days, compute the total accommodation, food, transport, and activity costs specifically for 3 days of stay. Use the ₹ symbol for all prices. For 'Cheap', keep expenses minimalist. For 'Moderate', represent mid-range comfort. For 'Luxury', represent premium experiences. Create a realistic breakdown of costs in categories like 'Accommodation', 'Food & Dining', 'Activities', and 'Local Transport'.

Return the itinerary strictly in valid JSON matching the response schema.`;

    const prompt = `Generate a customized ${duration} travel itinerary for a trip to: ${destination}.
Companion Group: ${companionType}
Budget Category: ${budget}
Duration of stay: ${duration}

Ensure all listed hotels and activities are placed inside or very near the destination of ${destination} with highly accurate coordinates. Keep activity descriptions engaging and beautifully tailored to ${companionType}. Compute a realistic estimated budget breakdown in Indian Rupees (INR, ₹) calculated specifically for the total cumulative ${duration} stay count, and supply high-quality Unsplash image URLs for the destination, each hotel, and each activity.`;

    const response = await generateContentWithRetryAndFallback(
      prompt,
      systemInstruction,
      travelItinerarySchema
    );

    const text = response.text;
    if (!text) {
      throw new Error("No response received from the Gemini AI model.");
    }

    // Try parsing the returned string as JSON
    const parsedItinerary = JSON.parse(text.trim());
    res.json(parsedItinerary);
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred while generating your itinerary.",
      details: error.stack || "",
    });
  }
});

// Configure Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
