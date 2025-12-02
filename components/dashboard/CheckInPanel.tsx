"use client";

import { useState, useEffect } from "react";
import {
    CalendarRange,
    Search,
    Users,
    Bed,
    CheckCircle2,
    AlertCircle,
    X,
    Trash2,
    ArrowLeft
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

// TYPES
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

interface SeleccionCheckIn {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
    esOcuparIgual: boolean;
}

interface Huesped {
    idHuesped: string;
    nombre: string;
    apellido: string;
    numDoc: string;
    tipoDocumento?: { tipoDocumento: string };
}


// COMPONENTE PRINCIPAL
export default function CheckInPanel() {

    // --- ESTADOS DE FLUJO ---
    const [paso, setPaso] = useState<'GRILLA' | 'HUESPEDES'>('GRILLA');
    const [loading, setLoading] = useState(false);

    // --- ESTADOS GRILLA ---
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);

    // Selección temporal
    const [tempSelect, setTempSelect] = useState<{
        start: string | null,
        end: string | null,
        roomId: string | null
    }>({ start: null, end: null, roomId: null });

    const [selecciones, setSelecciones] = useState<SeleccionCheckIn[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);

    // ESTADOS CONFLICTO
    const [modalConflicto, setModalConflicto] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<DisponibilidadDia[]>([]);

    // ESTADOS HUESPEDES
    const [searchApellido, setSearchApellido] = useState("");
    const [searchNombre, setSearchNombre] = useState("");
    const [searchDocumento, setSearchDocumento] = useState("");
    const [listaHuespedes, setListaHuespedes] = useState<Huesped[]>([]);
    const [titular, setTitular] = useState<string | null>(null);
    const [acompanantes, setAcompanantes] = useState<string[]>([]);

    useEffect(() => {
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        setDesde(hoy.toISOString().split('T')[0]);
        setHasta(manana.toISOString().split('T')[0]);
    }, []);

    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T00:00:00");
        return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
    };


    // 1. LÓGICA DE GRILLA Y BÚSQUEDA

    const handleBuscarDisponibilidad = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearched(true);
        setTempSelect({ start: null, end: null, roomId: null });

        try {
            const res = await fetch(`http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}`);
            const data = await res.json();
            setGridData(data);
        } catch (error) {
            console.error(error);
            alert("Error al cargar disponibilidad.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (roomId: string, dateStr: string, estado: string) => {

        if (estado === "OCUPADA" || estado === "MANTENIMIENTO") return;

        if (!tempSelect.start) {
            setTempSelect({ start: dateStr, end: null, roomId });
        } else if (tempSelect.start && !tempSelect.end) {
            if (tempSelect.roomId !== roomId) {
                setTempSelect({ start: dateStr, end: null, roomId });
                return;
            }
            let start = tempSelect.start;
            let end = dateStr;
            if (new Date(dateStr) < new Date(start)) {
                start = dateStr;
                end = tempSelect.start;
            }
            setTempSelect({ start, end, roomId });
        } else {
            setTempSelect({ start: dateStr, end: null, roomId });
        }
    };

    const isTempSelected = (roomId: string, dateStr: string) => {
        if (tempSelect.roomId !== roomId) return false;
        if (!tempSelect.start) return false;
        const d = new Date(dateStr);
        const start = new Date(tempSelect.start);
        if (!tempSelect.end) return d.getTime() === start.getTime();
        const end = new Date(tempSelect.end);
        return d >= start && d <= end;
    };

    const isFinalSelected = (roomId: string, dateStr: string) => {
        return selecciones.some(sel =>
            sel.idHabitacion === roomId &&
            new Date(dateStr) >= new Date(sel.fechaDesde) &&
            new Date(dateStr) <= new Date(sel.fechaHasta)
        );
    };


    const intentarAgregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;

        const hab = gridData.find(h => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        const start = new Date(tempSelect.start);
        const end = new Date(tempSelect.end);

        // Filtramos los días dentro del rango
        const diasRango = hab.disponibilidad.filter(d => {
            const current = new Date(d.fecha);
            return current >= start && current <= end;
        });

        const tieneReservas = diasRango.some(d => d.estado === "RESERVADA");
        const tieneDisponibles = diasRango.some(d => d.estado === "DISPONIBLE");
        const tieneBloqueos = diasRango.some(d => d.estado === "OCUPADA" || d.estado === "MANTENIMIENTO");


        if (tieneBloqueos) {
            alert("El rango seleccionado contiene días bloqueados (Ocupado o Mantenimiento).");
            return;
        }

        // MIXTO (Disponible + Reservado)
        if (tieneReservas && tieneDisponibles) {
            const conflictos = diasRango.filter(d => d.estado === "RESERVADA");
            setConflictDetails(conflictos);
            setModalConflicto(true);
            return;
        }

        // TODAS DISPONIBLES
        if (tieneDisponibles && !tieneReservas) {
            confirmarAgregar(false);
            return;
        }

        //TODAS RESERVADAS
        if (!tieneDisponibles && tieneReservas) {
            // Asumimos que es el check-in de la reserva existente
            confirmarAgregar(true);
            return;
        }
    };

    const confirmarAgregar = (esOcuparIgual: boolean) => {
        const hab = gridData.find(h => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        setSelecciones(prev => [
            ...prev,
            {
                idHabitacion: tempSelect.roomId!,
                fechaDesde: tempSelect.start!,
                fechaHasta: tempSelect.end!,
                numero: hab.habitacion.numero,
                esOcuparIgual: esOcuparIgual
            }
        ]);

        // Limpieza
        setTempSelect({ start: null, end: null, roomId: null });
        setModalConflicto(false);
        setConflictDetails([]);
        setPanelOpen(true);
    };

    const eliminarSeleccion = (index: number) => {
        setSelecciones(prev => prev.filter((_, i) => i !== index));
    };


    // 3. LÓGICA DE HUÉSPEDES Y FINALIZACIÓN

    const buscarHuesped = async () => {
        try {
            const res = await fetch("http://localhost:8080/Huesped/Buscar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    huesped: { nombre: searchNombre, apellido: searchApellido, numDoc: searchDocumento }
                })
            });
            const data = await res.json();
            setListaHuespedes(data.huespedesEncontrados || []);
        } catch (error) {
            console.error(error);
            alert("Error al buscar huéspedes");
        }
    };

    const handleFinalizarCheckIn = async () => {
        if (!titular) return;
        if (selecciones.length === 0) return;
        setLoading(true);

        const huespedTitularObj = listaHuespedes.find(h => h.idHuesped === titular);

        const payload = {
            huespedTitular: huespedTitularObj,
            acompanantesIds: acompanantes,
            habitaciones: selecciones.map(h => ({
                idHabitacion: h.idHabitacion,
                fechaDesde: `${h.fechaDesde}T14:00:00`,
                fechaHasta: `${h.fechaHasta}T10:00:00`
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/Estadia/CheckIn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.id === 0 || res.ok) {
                alert("Check-In realizado con éxito.");
                setSelecciones([]);
                setTitular(null);
                setAcompanantes([]);
                setPaso('GRILLA');
                handleBuscarDisponibilidad();
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    // RENDER

    const renderGrilla = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-green-100 pb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-green-800" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-green-950">Nuevo Check-In</h2>
                        <p className="text-sm text-gray-500">Paso 1: Seleccione fechas y habitaciones.</p>
                    </div>
                </div>

                <form onSubmit={handleBuscarDisponibilidad} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Desde</label>
                        <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} required />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Hasta</label>
                        <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} required />
                    </div>
                    <Button className="bg-green-700 text-white hover:bg-green-800" disabled={loading}>
                        <Search className="h-4 w-4 mr-2" />
                        {loading ? "..." : "Buscar"}
                    </Button>
                </form>
            </div>

            {searched && (
                <Card className="border-green-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-green-100 bg-green-50/30 flex justify-between items-center">
                        <h3 className="font-semibold text-green-950 flex items-center gap-2">
                            <Bed className="h-4 w-4" /> Estado de Habitaciones
                        </h3>
                        <Button onClick={() => setPanelOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                            Ver Seleccionadas ({selecciones.length})
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Cargando...</div>
                        ) : gridData.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                <tr>
                                    <th className="p-3 text-left bg-gray-50 border-b text-gray-600 font-medium sticky left-0 z-10 w-32">
                                        Habitación
                                    </th>
                                    {gridData[0].disponibilidad.map((d, i) => (
                                        <th key={i} className="p-2 border-b bg-gray-50 text-gray-600 font-medium min-w-[60px]">
                                            {formatearFecha(d.fecha)}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {gridData.map(row => (
                                    <tr key={row.habitacion.id_habitacion}>
                                        <td className="p-3 text-left bg-white sticky left-0 border-r border-b text-gray-700 shadow-sm">
                                            <div className="font-bold text-green-900 text-sm">Hab {row.habitacion.numero}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{row.habitacion.tipoHabitacion}</div>
                                        </td>
                                        {row.disponibilidad.map((dia, idx) => {
                                            const temp = isTempSelected(row.habitacion.id_habitacion, dia.fecha);
                                            const finalSel = isFinalSelected(row.habitacion.id_habitacion, dia.fecha);

                                            let bgColor = "bg-white text-gray-300";
                                            let content = "•";

                                            if (dia.estado === "DISPONIBLE") {
                                                bgColor = "bg-green-50 hover:bg-green-100 text-green-700";
                                                content = "Libre";
                                            } else if (dia.estado === "OCUPADA") {
                                                bgColor = "bg-red-50 text-red-300";
                                                content = "Ocu";
                                            } else if (dia.estado === "MANTENIMIENTO") {
                                                bgColor = "bg-gray-100 text-gray-400";
                                                content = "Mant";
                                            } else if (dia.estado === "RESERVADA") {
                                                bgColor = "bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium";
                                                content = "Res";
                                            }

                                            if (finalSel) {
                                                bgColor = "bg-blue-200 text-blue-900 font-bold border-blue-300";
                                                content = "Sel";
                                            }
                                            if (temp) {
                                                bgColor = "bg-blue-600 text-white font-bold";
                                                content = "+";
                                            }

                                            const clickable = dia.estado === "DISPONIBLE" || dia.estado === "RESERVADA";
                                            const cursorClass = clickable ? "cursor-pointer" : "cursor-not-allowed";

                                            return (
                                                <td
                                                    key={idx}
                                                    onClick={() => clickable && handleCellClick(row.habitacion.id_habitacion, dia.fecha, dia.estado)}
                                                    className={`p-1 border-b border-r transition-all duration-200 ${bgColor} ${cursorClass}`}
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
                            <div className="p-12 text-center text-gray-500">No hay datos.</div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );

    const renderBusquedaHuesped = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-green-950">
                    <Users className="w-6 h-6" /> Paso 2: Datos del Huésped
                </h2>
                <Button variant="outline" onClick={() => setPaso('GRILLA')}>Volver a la Grilla</Button>
            </div>

            <Card className="p-6 border-green-100 shadow-md">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <Input placeholder="Apellido" value={searchApellido} onChange={e => setSearchApellido(e.target.value)} />
                    <Input placeholder="Nombre" value={searchNombre} onChange={e => setSearchNombre(e.target.value)} />
                    <Input placeholder="DNI / Documento" value={searchDocumento} onChange={e => setSearchDocumento(e.target.value)} />
                    <Button onClick={buscarHuesped} className="bg-green-700 text-white hover:bg-green-800">
                        <Search className="w-4 h-4 mr-2"/> Buscar
                    </Button>
                </div>
                <div className="border-t pt-4">
                    {listaHuespedes.map(h => (
                        <div key={h.idHuesped} className="border border-gray-100 bg-gray-50/50 p-3 rounded-lg flex justify-between items-center hover:bg-white transition mb-2">
                            <div>
                                <p className="font-bold text-gray-800">{h.apellido}, {h.nombre}</p>
                                <p className="text-sm text-gray-500">Doc: {h.numDoc}</p>
                            </div>
                            <div className="flex gap-2">
                                {/* 1. BOTÓN TITULAR */}
                                <Button
                                    size="sm"
                                    variant={titular === h.idHuesped ? "default" : "outline"}

                                    className={titular === h.idHuesped ? "bg-green-600 hover:bg-green-700" : ""}

                                    onClick={() => setTitular(h.idHuesped)}
                                >
                                    {titular === h.idHuesped ? "Es Titular" : "Marcar Titular"}
                                </Button>

                                {/* 2. BOTÓN ACOMPAÑANTE */}
                                <Button
                                    size="sm"
                                    variant={acompanantes.includes(h.idHuesped) ? "default" : "outline"}


                                    className={acompanantes.includes(h.idHuesped) ? "bg-blue-600 hover:bg-blue-700" : ""}

                                    onClick={() => {
                                        if (acompanantes.includes(h.idHuesped)) {
                                            setAcompanantes(acompanantes.filter(id => id !== h.idHuesped));
                                        } else {
                                            setAcompanantes([...acompanantes, h.idHuesped]);
                                        }
                                    }}
                                >
                                    Acompañante
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end pt-4 border-t">
                    <Button className="bg-green-800 text-white hover:bg-green-900 px-8 py-6 text-lg" onClick={handleFinalizarCheckIn} disabled={!titular || loading || selecciones.length === 0}>
                        {loading ? "Procesando..." : `Confirmar Check-In (${selecciones.length} habs)`}
                    </Button>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-200px)]">
            {paso === 'GRILLA' && renderGrilla()}
            {paso === 'HUESPEDES' && renderBusquedaHuesped()}

            {/* PANEL LATERAL */}
            {panelOpen && (
                <div className="fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} />
                    <div className="ml-auto h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-green-100 p-6 animate-in slide-in-from-right duration-300 overflow-y-auto relative z-50 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-green-950 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5"/> Seleccionadas
                            </h2>
                            <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-3">
                            {selecciones.map((sel, i) => (
                                <div key={i} className="border border-green-200 rounded-lg p-3 bg-green-50 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-green-900 flex items-center gap-2">
                                            Habitación {sel.numero}
                                            {sel.esOcuparIgual && <span className="text-[10px] bg-yellow-200 px-1 rounded text-yellow-800">Ocupar Igual</span>}
                                        </div>
                                        <div className="text-xs text-gray-600">{formatearFecha(sel.fechaDesde)} ➝ {formatearFecha(sel.fechaHasta)}</div>
                                    </div>
                                    <button onClick={() => eliminarSeleccion(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 space-y-3 pt-6 border-t">
                            {tempSelect.start && tempSelect.end && (
                                <Button onClick={intentarAgregarSeleccion} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    Agregar Selección de Grilla
                                </Button>
                            )}
                            {selecciones.length > 0 && (
                                <Button onClick={() => { setPanelOpen(false); setPaso('HUESPEDES'); }} className="w-full bg-green-700 hover:bg-green-800 text-white py-6 font-semibold">
                                    Continuar a Huéspedes
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* (REQUISITO 3) - SIN NOMBRES */}
            <Dialog open={modalConflicto} onOpenChange={setModalConflicto}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="w-5 h-5"/> Conflicto en Rango Mixto
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Has seleccionado un rango que combina días <strong>Libres</strong> con días <strong>Reservados</strong>.
                            <br/><br/>
                            Los siguientes días ya tienen reserva (conflicto):
                        </DialogDescription>
                    </DialogHeader>

                    {/* LISTA DE FECHAS CONFLICTIVAS */}
                    <div className="max-h-[200px] overflow-y-auto bg-yellow-50 p-3 rounded border border-yellow-100 text-sm space-y-2">
                        {conflictDetails.map((dia, idx) => (
                            <div key={idx} className="flex justify-between border-b border-yellow-200 pb-1 last:border-0">
                                <span className="font-semibold text-yellow-900">{formatearFecha(dia.fecha)}</span>
                                <span className="text-yellow-800 italic">Reservada</span>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        {/* BOTÓN VOLVER */}
                        <Button variant="outline" onClick={() => setModalConflicto(false)} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4"/> Volver
                        </Button>

                        {/* BOTÓN OCUPAR IGUAL */}
                        <Button
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            onClick={() => confirmarAgregar(true)}
                        >
                            Ocupar Igual
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}