import { GoogleGenAI } from "@google/genai";
import { Product, LogEntry, User } from "../types";

// Initialize AI safely to prevent immediate crash if key is missing
const apiKey = process.env.API_KEY || "dummy_key_for_init";
const ai = new GoogleGenAI({ apiKey });

/**
 * Admin AI: Analyzes system logs and user data to give business/security advice.
 */
export const generateAdminReport = async (query: string, logs: LogEntry[], users: User[]): Promise<string> => {
    try {
        const recentLogs = logs.slice(0, 50).map(l => `[${l.type}] ${l.message} (${l.username})`).join('\n');
        const userStats = `Total Users: ${users.length}. Admins: ${users.filter(u=>u.role==='admin').length}.`;
        
        const prompt = `
            You are "Fazan OS", a high-tech security and business AI for the "FAZAN.CLOUD" vape shop system.
            You are talking to the OWNER. Be precise, analytical, and slightly cyber-punk/military style.

            Context Data:
            ${userStats}

            Recent System Logs (Last 50):
            ${recentLogs}

            Owner's Question: "${query}"

            Task:
            Analyze the data. Identify security threats, sales opportunities, or system anomalies.
            If the owner asks to generate a report, format it with bullet points.
            If there are multiple failed logins from one user, flag it as a threat.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] }
        });

        return response.text || "Система не может сформировать отчет. Данные повреждены.";
    } catch (e) {
        console.error("Admin AI Error", e);
        return "Ошибка соединения с ядром AI (Проверьте API Key).";
    }
};

/**
 * User Profiler: Analyzes specific user behavior logs to create a psychological profile.
 */
export const analyzeUserProfile = async (user: User): Promise<string> => {
    try {
        const behavior = user.behaviorLog 
            ? user.behaviorLog.map(b => `[${new Date(b.timestamp).toLocaleTimeString()}] Action: ${b.action}, Target: ${b.target || 'N/A'}`).join('\n')
            : "No recorded behavior.";
        
        const prompt = `
            ACT AS "FAZAN WATCHDOG", A SURVEILLANCE AI.
            
            TARGET SUBJECT: ${user.username}
            ROLE: ${user.role}
            LOCATION: ${user.location}
            DEVICE: ${user.device}
            
            BEHAVIOR LOGS:
            ${behavior}
            
            TASK:
            Generate a concise psychological and commercial profile of this user for the shop owner.
            
            INCLUDE:
            1. **Buying Potential**: (0-100%)
            2. **Psychotype**: (e.g., "Window Shopper", "Competitor Spy", "Whale", "Impulsive")
            3. **Interests**: Based on viewed products or searches.
            4. **Threat Assessment**: Is this user trying to hack or spam?
            
            STYLE:
            Military/Cyberpunk dossier.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] }
        });

        return response.text || "Данные недоступны.";
    } catch (e) {
        return "Ошибка анализа профиля.";
    }
};

/**
 * AI Advisor: Recommends products based on user query and current catalog.
 * USES GOOGLE SEARCH for grounding.
 */
export const getAiAdvice = async (userQuery: string, availableProducts: Product[]): Promise<string> => {
  try {
    const productContext = availableProducts
      .map(p => `- ${p.name} (${p.category}): ${p.price}₽. Desc: ${p.description}. In Stock: ${p.inStock}`)
      .join('\n');

    const prompt = `
      System Instruction:
      You are "Fazan", a cool, knowledgeable, and human-like sales assistant at the "FAZAN.CLOUD" premium vape shop.
      
      Personality:
      - You speak Russian.
      - You are casual but professional ("ты" or "вы" depending on context, but polite).
      - You use emojis occasionally to keep the vibe friendly.
      - You DO NOT sound like a robot. You sound like a guy who knows everything about vaping.
      
      Capabilities:
      - You have access to Google Search to find real-time info about vaping trends, news, or specific device specs if not in the catalog.
      - You have access to the SHOP CATALOG below.
      
      Catalog Context:
      ${productContext}

      User Query: "${userQuery}"

      Rules:
      1. Prioritize selling items from the Catalog Context.
      2. If the user asks about general vaping info (e.g., "what is salt nic?"), explain it simply using search results if needed.
      3. If the user asks about non-vaping topics (politics, math), jokingly refuse: "Бро, я тут только по пару. Давай про жижки?"
      4. STRICTLY 18+. Never recommend to minors.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Сорри, что-то я задумался. Спроси еще раз?";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Бро, связь с космосом прервалась. Попробуй позже.";
  }
};

/**
 * Visual Search: Matches an uploaded image to the closest product in the database.
 */
export const searchProductByImage = async (
  base64Image: string, 
  availableProducts: Product[]
): Promise<string | null> => {
  try {
    const productList = availableProducts.map(p => `ID: ${p.id}, Name: ${p.name}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Look at this image. Match it to one of the following products:\n${productList}\n\nReturn ONLY the ID of the matching product. If no close match is found, return "null".`
          }
        ]
      }
    });

    const text = response.text?.trim();
    if (text && text !== 'null') {
        return text.replace(/['"]+/g, ''); 
    }
    return null;
  } catch (error) {
    console.error("AI Visual Search Error:", error);
    return null;
  }
};

/**
 * Generates a product image based on the product name.
 */
export const generateProductImage = async (productName: string): Promise<string | null> => {
  try {
    // Note: Standard Gemini models might not support image generation directly in this SDK version unless using Imagen.
    // For safety in this demo environment, we will return null to fallback to placeholders 
    // or use a text prompt to describe it if needed. 
    // If you have access to Imagen via this SDK, you can use it.
    // Assuming 'gemini-3-flash-preview' for text-only description or fallback.
    return null; 
  } catch (error) {
    console.error("AI Image Gen Error:", error);
    return null;
  }
};

/**
 * Helper to convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Extracts the Open Graph image URL from a Telegram public post link.
 */
export const extractTelegramImage = async (telegramUrl: string): Promise<string | null> => {
  try {
    if (!telegramUrl.match(/t\.me\/[\w\d_]+\/\d+/)) return null;

    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(telegramUrl)}`);
    if (!response.ok) return null;

    const data = await response.json();
    const html = data.contents;
    
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (match && match[1]) {
      let imageUrl = match[1];
      if (imageUrl.includes('telegram.org/img/t_logo') || imageUrl.includes('twitter_card')) {
        return null; 
      }
      return imageUrl;
    }
    return null;
  } catch (e) {
    console.error("Failed to extract telegram image", e);
    return null;
  }
};