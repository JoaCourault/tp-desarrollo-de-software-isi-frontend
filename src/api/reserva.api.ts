// src/api/reserva.api.ts

const BASE = "http://localhost:8080/Reserva";

export async function checkInReserva(idReserva: string) {
    const res = await fetch(`${BASE}/CheckIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idReserva })
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Error realizando Check-In");
    }

    return data;
}

export async function checkInDirecto(payload: {
    idHabitacion: string,
    fechaDesde: string,
    fechaHasta: string,
    idHuespedTitular: string,
    acompanantesIds: string[]
}) {
    const res = await fetch(`${BASE}/CheckInDirecto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Error en Check-In directo");
    }

    return data;
}

/* <<<<<<<<<<<<<<  ✨ Windsurf Command ⭐ >>>>>>>>>>>>>>>> */
/**
 * Obtiene las reservas del día actual.
 *
 * @returns {Promise<HabitacionReservaDTO[]>} Una promesa que se resuelve con un array de objetos HabitaciónReservaDTO que representan las reservas del día actual.
 */
/* <<<<<<<<<<  b8f1fb55-35f5-46ed-8782-5bd65b2ea8f5  >>>>>>>>>>> */
export async function reservasDelDia() {
    const res = await fetch(`${BASE}/ReservasDelDia`);
    return await res.json();
}
