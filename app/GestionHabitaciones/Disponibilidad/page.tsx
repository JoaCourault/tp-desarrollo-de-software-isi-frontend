"use client";

import { useEffect, useState } from "react";
import { HabitacionApi } from "@/src/api/habitacion.api";
import type { HabitacionDTO } from "@/src/dto/Habitacion/HabitacionDTO";

const api = new HabitacionApi();

export default function GestionHabitacionesPage() {
    const [habitaciones, setHabitaciones] = useState<HabitacionDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fechas ingresadas por el usuario
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    // Resultado luego de presionar "Buscar"
    const [mostrarTabla, setMostrarTabla] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await api.listar();
                setHabitaciones(data);
            } catch (e) {
                const err = e as Error;
                setError(err.message ?? "Error al cargar habitaciones");
            } finally {
                setCargando(false);
            }
        };

        cargar();
    }, []);

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();

        if (!desde || !hasta) {
            alert("Debe ingresar ambas fechas.");
            return;
        }

        if (new Date(desde) > new Date(hasta)) {
            alert("La fecha 'Desde' no puede ser mayor a 'Hasta'.");
            return;
        }

        // Por ahora no filtramos por disponibilidad real
        // porque falta la tabla estadía. Solo mostramos la tabla.
        setMostrarTabla(true);
    };

    if (cargando) return <p className="p-8">Cargando habitaciones…</p>;
    if (error)
        return (
            <p className="p-8 text-red-600">
                Error cargando habitaciones: {error}
            </p>
        );

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-semibold">Gestión de Habitaciones</h1>

            {/* FORMULARIO DE FECHAS */}
            <form
                onSubmit={handleBuscar}
                className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-white shadow-sm"
            >
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Desde fecha
                    </label>
                    <input
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        className="border rounded-md px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Hasta fecha
                    </label>
                    <input
                        type="date"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                        className="border rounded-md px-3 py-2"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="px-4 py-2 bg-rose-900 text-white rounded-md hover:bg-rose-800"
                >
                    Buscar
                </button>
            </form>

            {/* TABLA DE HABITACIONES */}
            {mostrarTabla && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">
                        Habitaciones ({habitaciones.length})
                    </h2>

                    <table className="min-w-full border rounded-xl shadow-sm overflow-hidden text-sm">
                        <thead>
                        <tr className="bg-zinc-200 text-left">
                            <th className="p-3 border">N°</th>
                            <th className="p-3 border">Piso</th>
                            <th className="p-3 border">Tipo</th>
                            <th className="p-3 border">Capacidad</th>
                            <th className="p-3 border">Camas</th>
                            <th className="p-3 border">Precio</th>
                            <th className="p-3 border">Estado</th>
                            <th className="p-3 border">Detalles</th>
                        </tr>
                        </thead>

                        <tbody>
                        {habitaciones.map((h) => (
                            <tr key={h.id_habitacion} className="border">
                                <td className="p-3 border">{h.numero}</td>
                                <td className="p-3 border">{h.piso}</td>
                                <td className="p-3 border">{h.tipoHabitacion}</td>
                                <td className="p-3 border">{h.capacidad}</td>

                                <td className="p-3 border">
                                    {h.cantidadCamasIndividual} ind ·{" "}
                                    {h.cantidadCamasDobles} dob ·{" "}
                                    {h.cantidadCamasKingSize} king
                                </td>

                                <td className="p-3 border">
                                    {h.precio ? `$${h.precio}` : "-"}
                                </td>

                                <td
                                    className={`p-3 border font-semibold ${
                                        h.estado === "DISPONIBLE"
                                            ? "text-green-600"
                                            : h.estado === "OCUPADA"
                                                ? "text-red-600"
                                                : "text-yellow-600"
                                    }`}
                                >
                                    {h.estado}
                                </td>

                                <td className="p-3 border">
                                    {h.detalles || "-"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
