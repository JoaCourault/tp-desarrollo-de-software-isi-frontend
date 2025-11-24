"use client";

import { useState } from "react";
import {
    Bed,
    Search,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    CalendarRange
} from "lucide-react";

// --- COMPONENTES UI ---
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

// --- TIPOS ---
interface HabitacionDTO {
    id_habitacion: string;
    numero: number;
    tipoHabitacion: string;
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
    // Estados de Búsqueda
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // Estados de Selección
    const [seleccionRango, setSeleccionRango] = useState<{ start: string | null, end: string | null, roomId: string | null }>({ start: null, end: null, roomId: null });

    // Estados Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [guestData, setGuestData] = useState({ nombre: "", apellido: "", telefono: "" });

    // --- HELPER: Formatear fecha ---
    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
    };

    // --- LÓGICA DE BÚSQUEDA ---
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
            alert("Error al cargar disponibilidad. Verifique que el Backend esté corriendo.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE SELECCIÓN ---
    const handleCellClick = (roomId: string, dateStr: string, status: string) => {
        if (status === "MANTENIMIENTO" || status === "OCUPADA") {
            alert("La habitación está bloqueada por mantenimiento u ocupación física.");
            return;
        }
        if (status === "RESERVADA") {
            const confirmar = window.confirm("⚠️ Esta fecha ya tiene una reserva registrada.\n\n¿Desea seleccionarla de todas formas?");
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

    // --- LÓGICA DE CONFIRMACIÓN ---
    const handleIniciarReserva = () => {
        if (!seleccionRango.start || !seleccionRango.end) return;
        setModalOpen(true);
    };

    const handleConfirmarReserva = async () => {
        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            alert("Por favor complete todos los campos del huésped.");
            return;
        }
        try {
            const payload = {
                nombreCliente: guestData.nombre,
                apellidoCliente: guestData.apellido,
                telefonoCliente: guestData.telefono,
                fechaIngreso: seleccionRango.start,
                fechaEgreso: seleccionRango.end,
                idsHabitaciones: [seleccionRango.roomId]
            };
            const res = await fetch("http://localhost:8080/Reserva/Crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("¡Reserva creada con éxito!");
                setModalOpen(false);
                const ev = { preventDefault: () => {} } as React.FormEvent;
                handleBuscar(ev);
                setSeleccionRango({ start: null, end: null, roomId: null });
                setGuestData({ nombre: "", apellido: "", telefono: "" });
            } else {
                alert("Error al crear reserva en el servidor.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión con el servidor.");
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER TARJETA */}
            <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-rose-100 pb-4">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-rose-900" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">Consultar Disponibilidad</h2>
                        <p className="text-sm text-gray-500">Seleccione un rango de fechas para ver el estado de las habitaciones.</p>
                    </div>
                </div>

                <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3 space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Desde fecha</label>
                        <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} required className="bg-white focus-visible:ring-rose-400" />
                    </div>
                    <div className="w-full sm:w-1/3 space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Hasta fecha</label>
                        <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} required className="bg-white focus-visible:ring-rose-400" />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto bg-rose-900 hover:bg-rose-800 text-white gap-2 min-w-[120px]" disabled={loading}>
                        <Search className="h-4 w-4" />
                        {loading ? "Buscando..." : "Buscar"}
                    </Button>
                </form>
            </div>

            {/* GRILLA DE RESULTADOS */}
            {searched && (
                <Card className="border-rose-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-4 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center">
                        <h3 className="font-semibold text-rose-950 flex items-center gap-2">
                            <Bed className="h-4 w-4" /> Estado de Habitaciones
                        </h3>

                        {seleccionRango.start && seleccionRango.end && (
                            <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                                <span className="text-xs font-medium text-rose-800 bg-rose-100 px-2 py-1 rounded-md hidden sm:inline-block">
                                    {formatearFecha(seleccionRango.start)} - {formatearFecha(seleccionRango.end)}
                                </span>
                                <Button onClick={handleIniciarReserva} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Reservar Selección
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                <div className="w-6 h-6 border-2 border-rose-900 border-t-transparent rounded-full animate-spin"></div>
                                <p>Cargando disponibilidad...</p>
                            </div>
                        ) : gridData.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse border-spacing-0">
                                <thead>
                                <tr>
                                    <th className="p-3 text-left bg-gray-50/80 border-b text-gray-600 font-medium min-w-[140px] sticky left-0 z-10 backdrop-blur-sm shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        Habitación
                                    </th>
                                    {gridData[0].disponibilidad.map((d, i) => (
                                        <th key={i} className="p-2 border-b border-r border-gray-100 bg-gray-50/80 min-w-[45px] text-gray-600 font-medium">
                                            {formatearFecha(d.fecha)}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {gridData.map((row) => (
                                    <tr key={row.habitacion.id_habitacion} className="group hover:bg-gray-50/30 transition-colors">
                                        <td className="p-3 text-left border-r border-b border-gray-100 font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50/30 z-10 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="text-sm text-rose-950 font-semibold">Hab {row.habitacion.numero}</div>
                                            <div className="text-xs text-gray-400">{row.habitacion.tipoHabitacion}</div>
                                        </td>
                                        {row.disponibilidad.map((dia, idx) => {
                                            const selected = isSelected(row.habitacion.id_habitacion, dia.fecha);

                                            // =========================================================
                                            // LÓGICA DE COLORES SEGÚN TU REQUERIMIENTO
                                            // =========================================================

                                            // 1. DISPONIBLE (Default) -> VERDE
                                            let bgColor = "bg-green-100 hover:bg-green-200 cursor-pointer text-green-800";
                                            let content = "Libre";
                                            let borderClass = "border-b border-r border-white";

                                            // 2. OCUPADA / MANTENIMIENTO -> ROJO
                                            if (dia.estado === "OCUPADA") {
                                                bgColor = "bg-red-100 hover:bg-red-200 text-red-800 cursor-not-allowed";
                                                content = "Ocu";
                                            } else if (dia.estado === "MANTENIMIENTO") {
                                                // Mantenimiento suele tratarse como bloqueo/ocupado, así que rojo o gris oscuro.
                                                bgColor = "bg-gray-200 text-gray-600 cursor-not-allowed";
                                                content = "Mant";
                                            }
                                            // 3. RESERVADA -> AMARILLO
                                            else if (dia.estado === "RESERVADA") {
                                                bgColor = "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium cursor-pointer";
                                                content = "Res";
                                            }

                                            // 4. SELECCIÓN -> AZUL / CELESTE (Gana sobre todo)
                                            if (selected) {
                                                bgColor = "bg-blue-500 text-white hover:bg-blue-600 font-bold shadow-md scale-[1.05] z-20 transform transition-transform";
                                                content = "✓";
                                                borderClass = "border-b border-r border-blue-600 rounded-sm";
                                            }

                                            return (
                                                <td
                                                    key={idx}
                                                    className={`p-1 transition-all duration-150 text-[10px] ${bgColor} ${borderClass}`}
                                                    onClick={() => handleCellClick(row.habitacion.id_habitacion, dia.fecha, dia.estado)}
                                                    title={`${dia.estado} - ${dia.fecha}`}
                                                >
                                                    <div className="flex items-center justify-center h-full w-full min-h-[30px]">
                                                        {content}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-gray-400" />
                                </div>
                                <p>No hay habitaciones disponibles para mostrar en este rango.</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* MODAL DE CONFIRMACIÓN */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirmar Reserva
                        </DialogTitle>
                        <DialogDescription>
                            Complete los datos del huésped para finalizar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 space-y-2 text-sm mb-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Check-in:</span>
                            <span className="font-medium text-rose-950">{seleccionRango.start && formatearFecha(seleccionRango.start)} (12:00hs)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Check-out:</span>
                            <span className="font-medium text-rose-950">{seleccionRango.end && formatearFecha(seleccionRango.end)} (10:00hs)</span>
                        </div>
                        {seleccionRango.roomId && (
                            <div className="flex justify-between border-t border-rose-200/50 pt-2 mt-2">
                                <span className="text-gray-500">Habitación:</span>
                                <span className="font-medium text-rose-950">
                                    N° {gridData.find(g => g.habitacion.id_habitacion === seleccionRango.roomId)?.habitacion.numero}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Nombre *</label>
                                <Input
                                    value={guestData.nombre}
                                    onChange={e => setGuestData({...guestData, nombre: e.target.value})}
                                    className="h-9 bg-white focus-visible:ring-rose-400"
                                    placeholder="Ej: Juan"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Apellido *</label>
                                <Input
                                    value={guestData.apellido}
                                    onChange={e => setGuestData({...guestData, apellido: e.target.value})}
                                    className="h-9 bg-white focus-visible:ring-rose-400"
                                    placeholder="Ej: Pérez"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Teléfono *</label>
                            <Input
                                value={guestData.telefono}
                                onChange={e => setGuestData({...guestData, telefono: e.target.value})}
                                className="h-9 bg-white focus-visible:ring-rose-400"
                                placeholder="+54 11 ..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="h-9 border-rose-200 text-rose-900 hover:bg-rose-50">
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmarReserva} className="bg-rose-900 hover:bg-rose-800 text-white h-9">
                            Confirmar Reserva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}