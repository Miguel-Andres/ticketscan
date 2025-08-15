// src/pages/api/process-images.js

// Este es un endpoint de API de Astro.
// https://docs.astro.build/es/guides/endpoints/

export async function POST({ request }) {
  // Lógica para procesar imágenes vendrá aquí.
  // Por ahora, es un placeholder.

  // Ejemplo: leer datos del request
  // const data = await request.json();

  return new Response(
    JSON.stringify({ message: "Endpoint listo para procesar imágenes." }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
