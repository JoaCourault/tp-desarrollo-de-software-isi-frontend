import { PayerDTO, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";
import { Resultado } from "../dto/Resultado";
import { ResponsableDePago } from "../dto/ResponsableDePago/ResponsableDePago.dto";

const BASE_URL = "http://localhost:8080/ResponsablePago";

export interface BuscarResponsableDePagoRes {
    resultado: Resultado;
    responsableDePagos: ResponsableDePago[];
}

export const responsableApi = {
    // GET /ResponsableDePago/Buscar?cuit=20333...
    buscarPorCuit: async (cuit: string): Promise<ResponsableDePago[] | null> => {
        const response = await fetch(`${BASE_URL}/ObtenerResponsablesDePago`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cuit
            }),
        });

        if (!response.ok) throw new Error("Error al buscar responsable");
        const res: BuscarResponsableDePagoRes = await response.json();
        if (res.resultado?.id !== 0) {
            throw new Error(res.resultado?.mensaje || "Error desconocido en el servidor");
        }
        return res.responsableDePagos || null;
    },

    // POST /ResponsableDePago/Crear
    crear: async (payer: Partial<ResponsableDePago>): Promise<ResponsableDePago> => {
        const response = await fetch(`${BASE_URL}/AltaResponsableDePago`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                responsableDePagoDTO: payer
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || "Error al crear responsable");
        }
        return await response.json();
    }
};