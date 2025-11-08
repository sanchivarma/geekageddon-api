export const DEFAULT_LOCATION = {
  latitude: Number(process.env.GEEKSEEK_V2_LAT ?? 52.515),
  longitude: Number(process.env.GEEKSEEK_V2_LNG ?? 13.454),
};

export const DEFAULT_RADIUS_METERS = Number(process.env.GEEKSEEK_V2_RADIUS ?? 50_000);
export const DEFAULT_LANGUAGE = process.env.GEEKSEEK_V2_LANGUAGE ?? "en";
export const DEFAULT_REGION = process.env.GEEKSEEK_V2_REGION ?? "DE";
export const DEFAULT_LIMIT = Number(process.env.GEEKSEEK_V2_LIMIT ?? 20);
export const DEFAULT_TYPE = process.env.GEEKSEEK_V2_TYPE ?? "";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
