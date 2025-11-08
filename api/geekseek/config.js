const parseCoordinate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const DEFAULT_LOCATION = {
  latitude: parseCoordinate(process.env.GEEKSEEK_LAT),
  longitude: parseCoordinate(process.env.GEEKSEEK_LNG),
};

export const DEFAULT_RADIUS_METERS = Number(process.env.GEEKSEEK_RADIUS ?? 50_000);
export const DEFAULT_LANGUAGE = process.env.GEEKSEEK_LANGUAGE ?? "en";
export const DEFAULT_REGION = process.env.GEEKSEEK_REGION ?? "DE";
export const DEFAULT_LIMIT = Number(process.env.GEEKSEEK_LIMIT ?? 20);
export const DEFAULT_TYPE = process.env.GEEKSEEK_TYPE ?? "";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
