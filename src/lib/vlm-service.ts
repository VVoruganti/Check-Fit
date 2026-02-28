import type { GarmentDescription } from "@/types/garment";
import { GARMENT_TEMPLATES } from "@/data/garment-templates";

/**
 * VLM service integration point.
 * Currently returns mock results from templates.
 * Replace analyzeImage with real VLM endpoint call for production.
 */

const VLM_ENDPOINT = import.meta.env.VITE_VLM_ENDPOINT as string | undefined;

/**
 * Analyze an image and return a garment description.
 * Falls back to a template if no VLM endpoint is configured.
 */
export async function analyzeImage(
  _imageData: string,
  fallbackTemplate: string = "dress",
): Promise<GarmentDescription> {
  if (VLM_ENDPOINT) {
    try {
      const response = await fetch(VLM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: _imageData }),
      });
      if (response.ok) {
        return (await response.json()) as GarmentDescription;
      }
    } catch {
      // Fall through to mock
    }
  }

  // Mock: simulate VLM processing delay then return template
  await new Promise(resolve => setTimeout(resolve, 1500));
  return GARMENT_TEMPLATES[fallbackTemplate] ?? GARMENT_TEMPLATES.dress;
}

/**
 * Get a garment description from a template directly (no image needed).
 */
export function getTemplate(templateKey: string): GarmentDescription {
  return GARMENT_TEMPLATES[templateKey] ?? GARMENT_TEMPLATES.dress;
}
