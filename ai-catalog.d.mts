export interface CatalogModel {
  id: string;
  label: string;
  vendor: "gorouter" | "xkiro";
}
export const VENDORS: Record<string, { base: string; keyEnv: string }>;
export const MODELS: CatalogModel[];
export const DEFAULT_MODEL: string;
export function findModel(id: string): CatalogModel | null;
