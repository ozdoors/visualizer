// Provider-agnostic AI facade. The API routes import from here, so switching
// image engines is a single env var (AI_PROVIDER) with no route changes.
//
//   AI_PROVIDER=gemini  → Google Gemini 2.5 Flash Image  (default, cheaper)
//   AI_PROVIDER=openai  → OpenAI gpt-image-1.5
//
// Both modules create their API clients lazily (only when a function is
// actually called), so importing both here costs nothing at startup and
// doesn't require the other provider's key to be set.
import * as gemini from "./gemini";
import * as openai from "./openai";
import { env } from "./env";

const useOpenAI = env.aiProvider() === "openai";

export const analyzeScene = useOpenAI ? openai.analyzeScene : gemini.analyzeScene;
export const generateRailingEdit = useOpenAI
  ? openai.generateRailingEdit
  : gemini.generateRailingEdit;
export const estimateMeasurements = useOpenAI
  ? openai.estimateMeasurements
  : gemini.estimateMeasurements;
