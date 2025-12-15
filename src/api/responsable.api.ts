import { PayerDTO, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";

const BASE_URL = "http://localhost:8080/ResponsableDePago";

export const responsableApi = {
    // GET /ResponsableDePago/Buscar?cuit=20333...
    buscarPorCuit: async (cuit: string): Promise<PayerDTO | null> => {
        const response = await fetch(`${BASE_URL}/Buscar?cuit=${cuit}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Error al buscar responsable");
        return await response.json();
    },

    // POST /ResponsableDePago/Crear
    crear: async (payer: Partial<PayerDTO>): Promise<PayerDTO> => {
        const response = await fetch(`${BASE_URL}/Crear`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payer),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || "Error al crear responsable");
        }
        return await response.json();
    }
};