/**
 * Siembra de la biblioteca de demostración. Sólo corre si la tabla está vacía
 * (lo comprueba migrate.ts), así que no pisa datos reales nunca.
 */

import { CLINICAL_CASES } from "@/mock/clinicalCases";
import { LIBRARY_CASES } from "@/mock/libraryCases";
import { casesRepo } from "./cases.repo";

export async function seedDemoCases(): Promise<number> {
  const all = [...CLINICAL_CASES, ...LIBRARY_CASES];
  for (const c of all) await casesRepo.save(c);
  console.warn(`[db] Sembrados ${all.length} casos de demostración.`);
  return all.length;
}
