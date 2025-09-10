// UTM parameter extraction utilities

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Extracts UTM parameters from the current URL
 * @returns Object containing UTM parameters
 */
export function getUTMParameters(): UTMParameters {
  if (typeof window === "undefined") {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);

  return {
    utm_source: urlParams.get("utm_source") || undefined,
    utm_medium: urlParams.get("utm_medium") || undefined,
    utm_campaign: urlParams.get("utm_campaign") || undefined,
    utm_term: urlParams.get("utm_term") || undefined,
    utm_content: urlParams.get("utm_content") || undefined
  };
}

/**
 * Extracts UTM parameters from a given URL string
 * @param url - The URL to extract UTM parameters from
 * @returns Object containing UTM parameters
 */
export function getUTMParametersFromURL(url: string): UTMParameters {
  try {
    const urlObj = new URL(url);
    const urlParams = new URLSearchParams(urlObj.search);

    return {
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
      utm_term: urlParams.get("utm_term") || undefined,
      utm_content: urlParams.get("utm_content") || undefined
    };
  } catch {
    return {};
  }
}

/**
 * Checks if UTM parameters exist in the current URL
 * @returns True if any UTM parameters are present
 */
export function hasUTMParameters(): boolean {
  const utmParams = getUTMParameters();
  return Object.values(utmParams).some(value => value !== undefined);
}
