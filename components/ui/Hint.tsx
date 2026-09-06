"use client";

/**
 * Explicación al pasar el puntero.
 *
 * Enrique pedía saber qué significan las etiquetas del caso sin salir de la
 * pantalla. Sólo CSS: nada de librerías ni estado, y accesible con el teclado
 * porque también responde al foco.
 */
export function Hint({
  text,
  children,
  side = "bottom",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group/hint relative inline-flex focus-within:z-30 hover:z-30">
      <span tabIndex={0} className="inline-flex cursor-help outline-none">
        {children}
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-30 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-2 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/hint:opacity-100 group-focus-within/hint:opacity-100 ${
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
