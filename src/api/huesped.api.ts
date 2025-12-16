// src/api/huesped.api.ts

const BASE = "http://localhost:8080/Huesped";

export class HuespedApi {
    async alta(payload: any) {
        const res = await fetch(`${BASE}/Alta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        return await res.json();
    }

    async buscar(payload: any) {
        const res = await fetch(`${BASE}/Buscar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        return await res.json();
    }
    async modificar(payload: any) {
            const res = await fetch(`${BASE}/Modificar`, {
                method: "POST", // O PUT, según como lo hayas definido en el Controller (generalmente usamos POST para acciones complejas)
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            return await res.json();
        }
}

export const huespedApi = new HuespedApi();
