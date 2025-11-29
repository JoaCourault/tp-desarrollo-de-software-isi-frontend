"use client";

import { useState } from "react";
import {
    Bed,
    Search,
    CalendarRange,
    CheckCircle2,
    AlertCircle,
    Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

interface HabitacionDTO {
    id_habitacion: string;
    numero: number;
    tipoHabitacion: string; // ← confirmado por vos
    precio: number;
}

interface DisponibilidadDia {
    fecha: string;
    estado: "DISPONIBLE" | "OCUPADA" | "RESERVADA" | "MANTENIMIENTO";
}

interface HabitacionDisponibilidad {
    habitacion: HabitacionDTO;
    disponibilidad: DisponibilidadDia[];
}

export function RoomManagement() {
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // SELECCIÓN DE UN RANGO ACTUAL
    const [seleccionRango, setSeleccionRango] = useState<{
        start: string | null,
        end: string | null,
        roomId: string | null
    }>({ start: null, end: null, roomId: null });

    // CARRITO DE RESERVAS (B)
    const [reservasCarrito, setReservasCarrito] = useState<any[]>([]);

    // Modal ingreso de datos del huésped
    const [modalOpen, setModalOpen] = useState(false);
    const [guestData, setGuestData] = useState({
        nombre: "",
        apellido: "",
        telefono: ""
    });

    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
    };

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desde || !hasta) return;

        if (new Date(desde) > new Date(hasta)) {
            alert("La fecha 'Desde' no puede ser mayor a 'Hasta'");
            return;
        }

        setLoading(true);
        setSearched(true);
        setSeleccionRango({ start: null, end: null, roomId: null });

        try {
            const res = await fetch(`http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`);
            if (!res.ok) throw new Error("Error al obtener datos");

            const data: HabitacionDisponibilidad[] = await res.json();
            setGridData(data);
        } catch (error) {
            console.error(error);
            alert("Error al cargar disponibilidad.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (roomId: string, dateStr: string, status: string) => {
        if (status === "MANTENIMIENTO" || status === "OCUPADA") {
            alert("La habitación no se puede reservar en esta fecha.");
            return;
        }

        if (status === "RESERVADA") {
            const confirmar = window.confirm("Esta fecha ya tiene una reserva. ¿Desea seleccionarla igual?");
            if (!confirmar) return;
        }

        if (seleccionRango.roomId && seleccionRango.roomId !== roomId) {
            setSeleccionRango({ start: dateStr, end: null, roomId });
            return;
        }

        if (!seleccionRango.start || (seleccionRango.start && seleccionRango.end)) {
            setSeleccionRango({ start: dateStr, end: null, roomId });
        } else {
            if (new Date(dateStr) < new Date(seleccionRango.start)) {
                setSeleccionRango({ start: dateStr, end: seleccionRango.start, roomId });
            } else {
                setSeleccionRango({ ...seleccionRango, end: dateStr });
            }
        }
    };

    const isSelected = (roomId: string, dateStr: string) => {
        if (seleccionRango.roomId !== roomId) return false;
        if (seleccionRango.start === dateStr) return true;
        if (seleccionRango.end === dateStr) return true;

        if (seleccionRango.start && seleccionRango.end) {
            const d = new Date(dateStr);
            const start = new Date(seleccionRango.start);
            const end = new Date(seleccionRango.end);
            return d > start && d < end;
        }
        return false;
    };

    const isInCarrito = (roomId: string, dateStr: string) => {
    for (const r of reservasCarrito) {
        if (r.idHabitacion !== roomId) continue;

        const d = new Date(dateStr);
        const start = new Date(r.fechaDesde);
        const end = new Date(r.fechaHasta);

        if (d >= start && d <= end) return true;
    }
    return false;
};


    // --------------------------
    // AÑADIR UNA RESERVA AL CARRITO
    // --------------------------
    const agregarReservaAlCarrito = () => {
        if (!seleccionRango.start || !seleccionRango.end) return;

        const hab = gridData.find(g => g.habitacion.id_habitacion === seleccionRango.roomId)?.habitacion;
        if (!hab) return;

        const nueva = {
            idHabitacion: hab.id_habitacion,
            numero: hab.numero,
            tipoHabitacion: hab.tipoHabitacion,
            fechaDesde: seleccionRango.start,
            fechaHasta: seleccionRango.end
        };

        setReservasCarrito(prev => [...prev, nueva]);

        // Reset selección
        setSeleccionRango({ start: null, end: null, roomId: null });
    };

    const quitarReserva = (index: number) => {
        setReservasCarrito(prev => prev.filter((_, i) => i !== index));
    };

    // --------------------------
    // CONFIRMAR TODAS LAS RESERVAS DEL CARRITO
    // --------------------------
    const confirmarTodo = () => {
        if (reservasCarrito.length === 0) return;
        setModalOpen(true);
    };

    const handleConfirmarReserva = async () => {
        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            alert("Complete los datos del huésped.");
            return;
        }

        const payload = {
            nombreCliente: guestData.nombre,
            apellidoCliente: guestData.apellido,
            telefonoCliente: guestData.telefono,
            reservas: reservasCarrito.map(r => ({
                idHabitacion: r.idHabitacion,
                fechaDesde: r.fechaDesde,
                fechaHasta: r.fechaHasta
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/Reserva/Crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("¡Reservas creadas con éxito!");
                setModalOpen(false);
                setReservasCarrito([]);
                setGuestData({ nombre: "", apellido: "", telefono: "" });

                const ev = { preventDefault: () => {} } as React.FormEvent;
                handleBuscar(ev);
            } else {
                alert("Error al crear reserva.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

            {/* PANEL LATERAL DEL CARRITO */}
            <div className="fixed right-4 top-32 w-64 bg-white border border-rose-100 shadow-lg rounded-lg p-3 z-50">
                <h3 className="font-semibold text-rose-900 mb-2">Reservas cargadas</h3>

                {reservasCarrito.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay reservas.</p>
                ) : (
                    <div className="space-y-3">
                        {reservasCarrito.map((r, i) => (
                            <div key={i} className="border p-2 rounded-lg bg-rose-50 flex justify-between items-start">
                                <div className="text-sm">
                                    <p className="font-semibold text-rose-900">
                                        Hab {r.numero} ({r.tipoHabitacion})
                                    </p>
                                    <p className="text-gray-600 text-xs">
                                        {formatearFecha(r.fechaDesde)} → {formatearFecha(r.fechaHasta)}
                                    </p>
                                </div>
                                <Trash2
                                    className="h-4 w-4 text-red-600 cursor-pointer"
                                    onClick={() => quitarReserva(i)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {reservasCarrito.length > 0 && (
                    <Button
                        className="w-full mt-3 bg-rose-900 text-white hover:bg-rose-800"
                        onClick={confirmarTodo}
                    >
                        Confirmar Todas
                    </Button>
                )}
            </div>

            {/* TARJETA DE BÚSQUEDA */}
            <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">

                <div className="flex items-center gap-2 mb-6 border-b border-rose-100 pb-4">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-rose-900" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">
                            Consultar Disponibilidad
                        </h2>
                        <p className="text-sm text-gray-500">
                            Seleccione un rango de fechas para ver el estado.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3 space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Desde fecha</label>
                        <Input
                            type="date"
                            value={desde}
                            onChange={e => setDesde(e.target.value)}
                            className="bg-white"
                            required
                        />
                    </div>

                    <div className="w-full sm:w-1/3 space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Hasta fecha</label>
                        <Input
                            type="date"
                            value={hasta}
                            onChange={e => setHasta(e.target.value)}
                            className="bg-white"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-rose-900 hover:bg-rose-800 text-white"
                        disabled={loading}
                    >
                        <Search className="h-4 w-4" />
                        {loading ? "Buscando..." : "Buscar"}
                    </Button>
                </form>
            </div>

            {/* GRILLA */}
            {searched && (
                <Card className="border-rose-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center">
                        <h3 className="font-semibold text-rose-950 flex items-center gap-2">
                            <Bed className="h-4 w-4" /> Estado de Habitaciones
                        </h3>

                        {seleccionRango.start && seleccionRango.end && (
                            <Button
                                onClick={agregarReservaAlCarrito}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Agregar reserva
                            </Button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">
                                Cargando disponibilidad...
                            </div>
                        ) : gridData.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                <tr>
                                    <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-10">
                                        Habitación
                                    </th>
                                    {gridData[0].disponibilidad.map((d, i) => (
                                        <th key={i} className="p-2 border-b bg-gray-50 text-gray-600 font-medium">
                                            {formatearFecha(d.fecha)}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody>
                                {gridData.map((row) => (
                                    <tr key={row.habitacion.id_habitacion} className="group">
                                        <td className="p-3 text-left border-b bg-white sticky left-0 z-10">
                                            <div className="text-sm text-rose-950 font-semibold">
                                                Hab {row.habitacion.numero} ({row.habitacion.tipoHabitacion})
                                            </div>
                                        </td>

                                        {row.disponibilidad.map((dia, idx) => {
                                            const selected = isSelected(row.habitacion.id_habitacion, dia.fecha);

                                            let bgColor = "bg-green-100 text-green-800";
let content = "Libre";

// Estado real backend
if (dia.estado === "OCUPADA") {
    bgColor = "bg-red-100 text-red-800";
    content = "Ocu";
} else if (dia.estado === "MANTENIMIENTO") {
    bgColor = "bg-gray-200 text-gray-600";
    content = "Mant";
} else if (dia.estado === "RESERVADA") {
    bgColor = "bg-yellow-100 text-yellow-800";
    content = "Res";
}

// Selección actual del usuario (prioridad más alta)
if (selected) {
    bgColor = "bg-blue-500 text-white font-bold";
    content = "✓";
}
// Rango ya agregado al carrito (segunda prioridad)
else if (isInCarrito(row.habitacion.id_habitacion, dia.fecha)) {
    bgColor = "bg-blue-100 text-blue-900 font-semibold border border-blue-200";
    // Mostrar como “Carrito”
    content = "Selec";
}


                                            return (
                                                <td
                                                    key={idx}
                                                    className={`p-1 border-b ${bgColor} cursor-pointer`}
                                                    onClick={() =>
                                                        handleCellClick(
                                                            row.habitacion.id_habitacion,
                                                            dia.fecha,
                                                            dia.estado
                                                        )
                                                    }
                                                >
                                                    {content}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No hay datos.
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* MODAL CONFIRMACIÓN */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirmar Reserva
                        </DialogTitle>
                        <DialogDescription>
                            Complete los datos del huésped.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-600">Nombre *</label>
                                <Input
                                    value={guestData.nombre}
                                    onChange={e => setGuestData({ ...guestData, nombre: e.target.value })}
                                    className="h-9 bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Apellido *</label>
                                <Input
                                    value={guestData.apellido}
                                    onChange={e => setGuestData({ ...guestData, apellido: e.target.value })}
                                    className="h-9 bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-600">Teléfono *</label>
                            <Input
                                value={guestData.telefono}
                                onChange={e => setGuestData({ ...guestData, telefono: e.target.value })}
                                className="h-9 bg-white"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-rose-900 text-white hover:bg-rose-800"
                            onClick={handleConfirmarReserva}
                        >
                            Confirmar Reserva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
