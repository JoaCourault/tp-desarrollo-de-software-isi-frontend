"use client";

import { useState, useMemo } from "react";
import {
    Bed,
    Search,
    CheckCircle2,
    CalendarRange,
    X,
    Trash2,
    Plus,
    Filter
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

//Tipos
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

interface Seleccion {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
}

//COMPONENTE PRINCIPAL
export function RoomManagement() {

    const today = new Date().toISOString().split("T")[0];

    // Estados de búsqueda
    const [desde, setDesde] = useState(today);
    const [hasta, setHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);
    
    // NUEVO: Estado para el filtro de tipo de habitación
    const [filterType, setFilterType] = useState("TODAS");

    // Estado para selección temporal
    const [tempSelect, setTempSelect] = useState<{
        start: string | null,
        end: string | null,
        roomId: string | null,
        roomNumber: number | null // Guardamos el número para mostrarlo en el botón
    }>({ start: null, end: null, roomId: null, roomNumber: null });

    // Lista de reservas acumuladas
    const [selecciones, setSelecciones] = useState<Seleccion[]>([]);

    // Modales y Paneles
    const [modalOpen, setModalOpen] = useState(false);
    const [guestData, setGuestData] = useState({ nombre: "", apellido: "", telefono: "" });
    const [panelOpen, setPanelOpen] = useState(false);

    // Formateo de fechas
    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
    };

    // --- LÓGICA DE FILTRADO (NUEVO) ---
    // 1. Obtener tipos únicos de las habitaciones cargadas
    const tiposHabitacion = useMemo(() => {
        const tipos = new Set(gridData.map(item => item.habitacion.tipoHabitacion));
        return ["TODAS", ...Array.from(tipos)];
    }, [gridData]);

    // 2. Filtrar la data de la grilla
    const filteredGridData = gridData.filter(item => 
        filterType === "TODAS" || item.habitacion.tipoHabitacion === filterType
    );

    // BUSCAR DISPONIBILIDAD
    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (new Date(desde) < new Date(today)) {
            alert("No se puede buscar disponibilidad en el pasado.");
            return;
        }

        if (new Date(desde) > new Date(hasta)) {
            alert("La fecha 'Desde' no puede ser mayor a 'Hasta'");
            return;
        }

        setLoading(true);
        setSearched(true);
        setTempSelect({ start: null, end: null, roomId: null, roomNumber: null });

        try {
            const res = await fetch(`http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`);
            if (!res.ok) throw new Error("Error al obtener datos");
            const data: HabitacionDisponibilidad[] = await res.json();
            setGridData(data);
        } catch (e) {
            alert("Error cargando disponibilidad");
        } finally {
            setLoading(false);
        }
    };

    // --- SELECCIÓN DE RANGOS (CORREGIDO: Lógica de validación de superposición) ---
    // --- LÓGICA DE SELECCIÓN DE RANGOS ---
    const handleCellClick = (roomId: string, dateStr: string, estado: string, numero: number) => {
        // 1. Bloqueo básico de estados (Base de Datos)
        if (estado === "OCUPADA" || estado === "MANTENIMIENTO" || estado === "RESERVADA") {
            alert(`La habitación ${numero} no está disponible en esta fecha.`);
            return;
        }

        // 2. Bloqueo si esa FECHA ESPECÍFICA ya está en el carrito para esa habitación
        const fechaOcupada = selecciones.some(s => 
            s.idHabitacion === roomId && 
            dateStr >= s.fechaDesde && 
            dateStr <= s.fechaHasta
        );
        
        if (fechaOcupada) {
            return; // Ignorar clic silenciosamente para evitar errores
        }

        // 3. Lógica de Rango (Inicio - Fin)
        if (!tempSelect.start || tempSelect.roomId !== roomId) {
            // Nuevo inicio de selección
            setTempSelect({ start: dateStr, end: null, roomId, roomNumber: numero });
        } else if (tempSelect.start && !tempSelect.end) {
            // Intentar cerrar el rango
            let start = tempSelect.start;
            let end = dateStr;

            // Ordenar fechas si el usuario seleccionó al revés
            if (new Date(dateStr) < new Date(start)) {
                start = dateStr;
                end = tempSelect.start;
            }

            // 4. VALIDACIÓN DE CONFLICTOS
            
            // A. Conflicto con la Base de Datos (GridData)
            const row = gridData.find(r => r.habitacion.id_habitacion === roomId);
            if (row) {
                const diasEnRango = row.disponibilidad.filter(d => d.fecha >= start && d.fecha <= end);
                const hayConflictoBD = diasEnRango.some(d => d.estado !== "DISPONIBLE");
                
                if (hayConflictoBD) {
                    alert("El rango seleccionado incluye fechas no disponibles. Por favor seleccione un rango continuo libre.");
                    setTempSelect({ start: null, end: null, roomId: null, roomNumber: null }); // Reiniciar
                    return;
                }
            }

            // B. Conflicto con el Carrito (Misma habitación, fechas solapadas)
            const hayConflictoCarrito = selecciones.some(sel => 
                sel.idHabitacion === roomId && 
                ((start >= sel.fechaDesde && start <= sel.fechaHasta) || 
                 (end >= sel.fechaDesde && end <= sel.fechaHasta) ||
                 (start <= sel.fechaDesde && end >= sel.fechaHasta))
            );

            if (hayConflictoCarrito) {
                alert("Este rango se superpone con otra reserva que ya tienes en el carrito para esta habitación.");
                setTempSelect({ start: null, end: null, roomId: null, roomNumber: null });
                return;
            }

            // Si pasa todas las validaciones, cerramos el rango
            setTempSelect({ start, end, roomId, roomNumber: numero });
        } else {
            // Reiniciar selección (clic en una tercera celda o nueva selección)
            setTempSelect({ start: dateStr, end: null, roomId, roomNumber: numero });
        }
    };

    const isTempSelected = (roomId: string, dateStr: string) => {
        if (tempSelect.roomId !== roomId) return false;
        if (!tempSelect.start) return false;

        const d = dateStr; // Trabajamos con strings ISO YYYY-MM-DD
        const start = tempSelect.start;
        
        // Si solo hay inicio seleccionado
        if (!tempSelect.end) return d === start;

        // Si hay rango completo
        const end = tempSelect.end;
        return d >= start && d <= end;
    };

    // AÑADIR RESERVA (MODIFICADO: Ahorro de clicks)
    const agregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;

        setSelecciones(prev => [
            ...prev,
            {
                idHabitacion: tempSelect.roomId!,
                fechaDesde: tempSelect.start!,
                fechaHasta: tempSelect.end!,
                numero: tempSelect.roomNumber!
            }
        ]);

        // Limpiamos la selección temporal pero NO abrimos el panel para permitir seguir seleccionando rápido
        setTempSelect({ start: null, end: null, roomId: null, roomNumber: null });
    };

    const eliminarSeleccion = (index: number) => {
        setSelecciones(prev => prev.filter((_, i) => i !== index));
    };

    const isFinalSelected = (roomId: string, dateStr: string) => {
        return selecciones.some(sel =>
            sel.idHabitacion === roomId &&
            dateStr >= sel.fechaDesde &&
            dateStr <= sel.fechaHasta
        );
    };

    // CONFIRMAR RESERVA
    const handleConfirmarReserva = async () => {
        if (!guestData.nombre || !guestData.apellido || !guestData.telefono) {
            alert("Complete todos los campos del huésped");
            return;
        }

        const payload = {
            nombreCliente: guestData.nombre,
            apellidoCliente: guestData.apellido,
            telefonoCliente: guestData.telefono,
            reservas: selecciones.map(s => ({
                idHabitacion: s.idHabitacion,
                fechaDesde: s.fechaDesde,
                fechaHasta: s.fechaHasta
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/Reserva/Crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("¡Reserva creada!");
                setSelecciones([]);
                setTempSelect({ start: null, end: null, roomId: null, roomNumber: null });
                setModalOpen(false);
                setPanelOpen(false);
                setGuestData({ nombre: "", apellido: "", telefono: "" });
                const ev = { preventDefault() {} } as React.FormEvent;
                handleBuscar(ev);
            } else {
                alert("Error al reservar.");
            }
        } catch (e) {
            alert("Error de conexión");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER DE BÚSQUEDA */}
            <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-rose-100 pb-4">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-rose-900" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-rose-950">Consultar Disponibilidad</h2>
                        <p className="text-sm text-gray-500">Seleccione un rango de fechas.</p>
                    </div>
                </div>

                <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Desde</label>
                        <Input 
                            type="date" 
                            value={desde} 
                            min={today}
                            onChange={e => setDesde(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Hasta</label>
                        <Input 
                            type="date" 
                            value={hasta} 
                            min={desde || today}
                            onChange={e => setHasta(e.target.value)} 
                            required 
                        />
                    </div>

                    <Button className="bg-rose-900 text-white hover:bg-rose-800" disabled={loading}>
                        <Search className="h-4 w-4" />
                        {loading ? "Buscando..." : "Buscar"}
                    </Button>
                </form>
            </div>

            {/* GRILLA DE RESULTADOS */}
            {searched && (
                <Card className="border-rose-100 shadow-sm overflow-hidden">

                    {/* PANEL SUPERIOR DE LA GRILLA (FILTROS Y ACCIONES) */}
                    <div className="p-3 border-b border-rose-100 bg-rose-50/30 flex flex-wrap gap-4 justify-between items-center">
                        
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-rose-950 flex items-center gap-2">
                                <Bed className="h-4 w-4" /> Habitaciones
                            </h3>

                            {/* FILTRO POR TIPO DE HABITACIÓN */}
                            {gridData.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-400" />
                                    <select 
                                        className="text-sm border-gray-200 rounded-md focus:ring-rose-500 focus:border-rose-500 bg-white py-1 px-2 shadow-sm"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        {tiposHabitacion.map(tipo => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* BOTÓN "AÑADIR SELECCIÓN" (Aparece dinámicamente) */}
                            {tempSelect.start && tempSelect.end && (
                                <Button
                                    onClick={agregarSeleccion}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm animate-in fade-in zoom-in duration-200"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar Hab {tempSelect.roomNumber}
                                </Button>
                            )}

                            {/* BOTÓN VER CARRITO */}
                            <Button
                                onClick={() => setPanelOpen(true)}
                                size="sm"
                                variant={selecciones.length > 0 ? "default" : "outline"}
                                className={`gap-2 ${selecciones.length > 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-600"}`}
                            >
                                Reservas ({selecciones.length})
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Cargando...</div>
                        ) : filteredGridData.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-10 min-w-[120px]">
                                            Habitación
                                        </th>
                                        {gridData[0].disponibilidad.map((d, i) => (
                                            <th key={i} className="p-2 border-b bg-gray-50 text-gray-600 font-medium min-w-[40px]">
                                                {formatearFecha(d.fecha)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredGridData.map(row => (
                                        <tr key={row.habitacion.id_habitacion}>
                                            <td className="p-3 text-left bg-white sticky left-0 border-r border-b text-gray-700">
                                                <div className="font-semibold text-rose-950">Hab {row.habitacion.numero}</div>
                                                <div className="text-xs text-gray-400 truncate max-w-[100px]" title={row.habitacion.tipoHabitacion}>
                                                    {row.habitacion.tipoHabitacion}
                                                </div>
                                            </td>

                                            {row.disponibilidad.map((dia, idx) => {
                                                const temp = isTempSelected(row.habitacion.id_habitacion, dia.fecha);
                                                const finalSel = isFinalSelected(row.habitacion.id_habitacion, dia.fecha);

                                                // Estado Base: DISPONIBLE (Verde)
                                                let bgColor = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer border border-emerald-200";
                                                let content = "Libre"; 
                                                let clickable = true;

                                                // Estados Ocupados (Rojo/Gris/Amarillo)
                                                if (dia.estado === "OCUPADA") {
                                                    bgColor = "bg-red-100 text-red-700 cursor-not-allowed";
                                                    content = "Ocu";
                                                    clickable = false;
                                                } else if (dia.estado === "MANTENIMIENTO") {
                                                    bgColor = "bg-gray-100 text-gray-400 cursor-not-allowed";
                                                    content = "Mant";
                                                    clickable = false;
                                                } else if (dia.estado === "RESERVADA") {
                                                    bgColor = "bg-yellow-100 text-yellow-700 cursor-not-allowed";
                                                    content = "Res";
                                                    clickable = false;
                                                }

                                                // Estados de Selección (Azul)
                                                if (finalSel) {
                                                    // Ya confirmado en carrito (Azul Fuerte)
                                                    bgColor = "bg-blue-600 text-white font-bold ring-1 ring-inset ring-blue-700 cursor-not-allowed";
                                                    content = "✓";
                                                    clickable = false; // Bloqueamos clic SOLO en estas celdas ya elegidas
                                                } else if (temp) {
                                                    // Seleccionando ahora (Celeste/Azul Claro)
                                                    bgColor = "bg-blue-500 text-white font-bold shadow-md transform scale-105 z-10";
                                                    content = "✓";
                                                }

                                                const cursorClass = clickable ? "cursor-pointer" : "cursor-not-allowed opacity-80";

                                                return (
                                                    <td
                                                        key={idx}
                                                        onClick={() =>
                                                            clickable &&
                                                            handleCellClick(
                                                                row.habitacion.id_habitacion,
                                                                dia.fecha,
                                                                dia.estado,
                                                                row.habitacion.numero
                                                            )
                                                        }
                                                        className={`p-1 border-b border-r transition-all duration-150 ${bgColor} ${cursorClass}`}
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
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                <Search className="h-10 w-10 text-gray-300 mb-2"/>
                                <p>No se encontraron habitaciones con el filtro "{filterType}".</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* SLIDE-OVER (CARRITO DE RESERVAS) */}
            {panelOpen && (
                <div className="fixed inset-0 z-40 flex">
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setPanelOpen(false)}
                    />
                    <div className="ml-auto h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-rose-100 p-6 animate-in slide-in-from-right duration-300 overflow-y-auto relative z-50 flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-rose-950 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                Por Confirmar
                            </h2>
                            <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {selecciones.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Bed className="h-12 w-12 mx-auto text-gray-200 mb-2" />
                                    <p>No has seleccionado habitaciones aún.</p>
                                    <Button variant="link" onClick={() => setPanelOpen(false)}>
                                        Volver a la grilla
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selecciones.map((sel, i) => (
                                        <div key={i} className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-blue-900 text-lg">
                                                    Habitación {sel.numero}
                                                </div>
                                                <div className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                                                    <CalendarRange className="h-3 w-3" />
                                                    {formatearFecha(sel.fechaDesde)} - {formatearFecha(sel.fechaHasta)}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => eliminarSeleccion(i)}
                                                className="p-2 hover:bg-white rounded-full text-red-500 transition-colors shadow-sm"
                                                title="Quitar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selecciones.length > 0 && (
                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <Button
                                    onClick={() => setModalOpen(true)}
                                    className="w-full bg-rose-900 hover:bg-rose-800 text-white h-12 text-lg shadow-lg shadow-rose-900/10"
                                >
                                    Continuar ({selecciones.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL FINAL DE DATOS */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md border-rose-100">
                    <DialogHeader>
                        <DialogTitle className="text-rose-950 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Datos del Titular
                        </DialogTitle>
                        <DialogDescription>
                            Ingrese los datos para finalizar la reserva.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <Input
                            placeholder="Nombre"
                            value={guestData.nombre}
                            onChange={e => setGuestData({ ...guestData, nombre: e.target.value })}
                        />
                        <Input
                            placeholder="Apellido"
                            value={guestData.apellido}
                            onChange={e => setGuestData({ ...guestData, apellido: e.target.value })}
                        />
                        <Input
                            placeholder="Teléfono"
                            value={guestData.telefono}
                            onChange={e => setGuestData({ ...guestData, telefono: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Volver
                        </Button>
                        <Button onClick={handleConfirmarReserva} className="bg-rose-900 text-white min-w-[120px]">
                            Confirmar Reserva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}