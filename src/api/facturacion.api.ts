import { DatosFacturaPDF } from "@/src/dto/Facturacion.dto";

const BASE_URL = "http://localhost:8080/Factura";

export interface GenerarFacturaRequest {
    idEstadia: string;
    idResponsable: string;
    items: { idServicio?: string, descripcion: string, cantidad: number, monto: number }[];
    tipoFactura: "A" | "B" | "C";
    total: number;
}

export const facturacionApi = {
    // POST /Factura/Generar
    generar: async (request: GenerarFacturaRequest): Promise<{ numeroComprobante: string }> => {
        const response = await fetch(`${BASE_URL}/Generar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || "Error al generar factura");
        }
        return await response.json();
    }
};