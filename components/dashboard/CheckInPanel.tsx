"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Users,
    Bed,
    CalendarDays,
    ListChecks,
    ArrowRight,
    Clock,
    UserCheck,
    LogOut,
    Trash2,
    Save,
    AlertTriangle,
    PlusCircle,
    UserPlus,
    CheckCircle2,
    X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

// IMPORTAMOS EL COMPONENTE DE ALERTAS PERSONALIZADO
import ModalAlert from "@/components/modalAlert/modalAlert";

import {
    GrillaDisponibilidad,
    type HabitacionDisponibilidad,
    type DisponibilidadDia
} from "@/components/GrillaDisponibilidad";

import { TIPOS_HABITACION } from "@/src/constants/tiposHabitacion";

//  TYPES LOCALES
interface Huesped {
    idHuesped: string;
    nombre: string;
    apellido: string;
    numDoc: string;
    tipoDocumento?: { tipoDocumento: string };
    email?: string;
}

interface SeleccionCheckIn {
    idHabitacion: string;
    fechaDesde: string;
    fechaHasta: string;
    numero: number;
    esOcuparIgual: boolean;
    huespedes: Huesped[];
}

//  UTILIDADES
const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getTomorrowString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "-";
    const date = new Date(fechaStr + "T00:00:00");
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit"
    }).format(date);
};

//  COMPONENTE PRINCIPAL
export default function CheckInPanel() {
    // ESTADOS FLUJO
    const [paso, setPaso] = useState<"GRILLA" | "HUESPEDES">("GRILLA");
    const [loading, setLoading] = useState(false);

    // ESTADOS GRILLA
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [tipoHabitacion, setTipoHabitacion] = useState("");

    const [gridData, setGridData] = useState<HabitacionDisponibilidad[]>([]);
    const [searched, setSearched] = useState(false);
    const [tempSelect, setTempSelect] = useState<{
        start: string | null;
        end: string | null;
        roomId: string | null;
    }>({ start: null, end: null, roomId: null });

    // ESTADO DATOS
    const [selecciones, setSelecciones] = useState<SeleccionCheckIn[]>([]);
    const [titularGlobal, setTitularGlobal] = useState<Huesped | null>(null);

    // UI & MODALES (Logica)
    const [habitacionActivaIndex, setHabitacionActivaIndex] = useState<number>(0);
    const [modalConflicto, setModalConflicto] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<DisponibilidadDia[]>([]);
    const [alertPendingOpen, setAlertPendingOpen] = useState(false);

    // MODALES NUEVOS (REEMPLAZO DE ALERTS)
    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info' | 'warning' | 'error' | 'success'; title: string; msg: string }>({
        open: false, type: 'info', title: '', msg: ''
    });

    const [modalSalirOpen, setModalSalirOpen] = useState(false);
    const [modalExitoOpen, setModalExitoOpen] = useState(false);

    // BÚSQUEDA HUESPEDES
    const [searchApellido, setSearchApellido] = useState("");
    const [searchNombre, setSearchNombre] = useState("");
    const [searchDocumento, setSearchDocumento] = useState("");
    const [searchTipoDoc, setSearchTipoDoc] = useState("");

    const [listaHuespedes, setListaHuespedes] = useState<Huesped[]>([]);

    // INIT
    useEffect(() => {
        setDesde(getTodayString());
        setHasta(getTomorrowString());
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setTempSelect({ start: null, end: null, roomId: null });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    //  HELPER ALERTAS
    const triggerAlert = (type: 'info' | 'warning' | 'error' | 'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    //  LOGICA DE GRILLA
    const handleBuscarDisponibilidad = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (desde !== getTodayString()) {
            triggerAlert("warning", "Fecha Incorrecta", "El Check-In debe realizarse con fecha de inicio HOY.");
            setDesde(getTodayString());
            return;
        }
        realizarBusquedaGrilla();
    };

    const realizarBusquedaGrilla = async () => {
        setLoading(true);
        setSearched(true);
        setTempSelect({ start: null, end: null, roomId: null });

        try {
            const res = await fetch(
                `http://localhost:8080/Reserva/Disponibilidad?desde=${desde}&hasta=${hasta}&tipo=${tipoHabitacion}`
            );
            const data = await res.json();
            setGridData(data);
        } catch (error) {
            console.error(error);
            setGridData([]);
            triggerAlert("error", "Error de Conexión", "No se pudo obtener la disponibilidad.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (roomId: string, dateStr: string, estado: string) => {
        const todayStr = getTodayString();
        if (estado === "OCUPADA" || estado === "MANTENIMIENTO") return;

        if (!tempSelect.start) {
            if (dateStr !== todayStr) return;
            setTempSelect({ start: dateStr, end: null, roomId });
        } else if (tempSelect.start && !tempSelect.end) {
            if (tempSelect.roomId !== roomId) {
                if (dateStr === todayStr)
                    setTempSelect({ start: dateStr, end: null, roomId });
                else setTempSelect({ start: null, end: null, roomId: null });
                return;
            }
            if (new Date(dateStr) <= new Date(tempSelect.start)) {
                setTempSelect({ start: todayStr, end: null, roomId });
                return;
            }
            setTempSelect({ start: tempSelect.start, end: dateStr, roomId });
        } else {
            if (dateStr === todayStr)
                setTempSelect({ start: dateStr, end: null, roomId });
            else setTempSelect({ start: null, end: null, roomId: null });
        }
    };

    const intentarAgregarSeleccion = () => {
        if (!tempSelect.start || !tempSelect.end || !tempSelect.roomId) return;
        const hab = gridData.find((h) => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        const start = new Date(tempSelect.start);
        const end = new Date(tempSelect.end);
        const diasRango = hab.disponibilidad.filter((d) => {
            const current = new Date(d.fecha);
            return current >= start && current <= end;
        });

        const tieneBloqueos = diasRango.some((d) => d.estado === "OCUPADA" || d.estado === "MANTENIMIENTO");
        if (tieneBloqueos) {
            triggerAlert("warning", "Selección Inválida", "El rango seleccionado contiene días bloqueados.");
            return;
        }

        const tieneReservas = diasRango.some((d) => d.estado === "RESERVADA");
        const tieneDisponibles = diasRango.some((d) => d.estado === "DISPONIBLE");

        if (tieneReservas && tieneDisponibles) {
            setConflictDetails(diasRango.filter((d) => d.estado === "RESERVADA"));
            setModalConflicto(true);
            return;
        }
        if (!tieneDisponibles && tieneReservas) {
            confirmarAgregar(true);
            return;
        }
        confirmarAgregar(false);
    };

    const confirmarAgregar = (esOcuparIgual: boolean) => {
        const hab = gridData.find((h) => h.habitacion.id_habitacion === tempSelect.roomId);
        if (!hab) return;

        setSelecciones((prev) => [
            ...prev,
            {
                idHabitacion: tempSelect.roomId!,
                fechaDesde: tempSelect.start!,
                fechaHasta: tempSelect.end!,
                numero: hab.habitacion.numero,
                esOcuparIgual: esOcuparIgual,
                huespedes: []
            }
        ]);
        setTempSelect({ start: null, end: null, roomId: null });
        setModalConflicto(false);
    };

    const eliminarSeleccion = (index: number) => {
        setSelecciones((prev) => prev.filter((_, i) => i !== index));
        if (habitacionActivaIndex >= index && habitacionActivaIndex > 0) {
            setHabitacionActivaIndex(habitacionActivaIndex - 1);
        }
    };

    const checkPendingAndContinue = () => {
        if (tempSelect.start && tempSelect.end && tempSelect.roomId) {
            setAlertPendingOpen(true);
        } else {
            setPaso("HUESPEDES");
            setHabitacionActivaIndex(0);
        }
    };

    const handleDiscardAndContinue = () => {
        setTempSelect({ start: null, end: null, roomId: null });
        setAlertPendingOpen(false);
        setPaso("HUESPEDES");
        setHabitacionActivaIndex(0);
    };

    const handleAddAndContinue = () => {
        intentarAgregarSeleccion();
        setAlertPendingOpen(false);
    };

    const volverAGrilla = () => {
        setPaso("GRILLA");
        setTempSelect({ start: null, end: null, roomId: null });
        if (!searched) realizarBusquedaGrilla();
    };

    //  LOGICA DE HUÉSPEDES
    const buscarHuesped = async () => {
        try {
            // Preparamos payload con el NUEVO FILTRO DE TIPO DOC
            const payload = {
                huesped: {
                    nombre: searchNombre || null,
                    apellido: searchApellido || null,
                    numDoc: searchDocumento || null,
                    tipoDoc: searchTipoDoc ? { tipoDocumento: searchTipoDoc } : null
                }
            };

            const res = await fetch("http://localhost:8080/Huesped/Buscar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            // ORDENAMIENTO ALFABÉTICO (A-Z Apellido)
            const ordenados = (data.huespedesEncontrados || []).sort((a: Huesped, b: Huesped) =>
                a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' })
            );

            setListaHuespedes(ordenados);

        } catch (error) {
            triggerAlert("error", "Error", "Ocurrió un error al buscar huéspedes.");
        }
    };

    const limpiarFormularioHuesped = () => {
        setSearchApellido("");
        setSearchNombre("");
        setSearchDocumento("");
        setSearchTipoDoc(""); // Limpiar también el combo
        setListaHuespedes([]);
        document.getElementById("input-apellido")?.focus();
    };

    const toggleHuespedEnActiva = (huesped: Huesped) => {
        const index = habitacionActivaIndex;
        if (index < 0 || index >= selecciones.length) return;

        const estaEnOtra = selecciones.some((sel, idx) =>
            idx !== index && sel.huespedes?.some(h => h.idHuesped === huesped.idHuesped)
        );

        if (estaEnOtra) {
            triggerAlert("warning", "Huésped Asignado", `El huésped ${huesped.apellido} ya está asignado a otra habitación.`);
            return;
        }

        setSelecciones((prev) => {
            const nuevas = [...prev];
            const habitacion = { ...nuevas[index], huespedes: nuevas[index].huespedes || [] };
            const yaEsta = habitacion.huespedes.some((h) => h.idHuesped === huesped.idHuesped);

            if (yaEsta) {
                habitacion.huespedes = habitacion.huespedes.filter((h) => h.idHuesped !== huesped.idHuesped);
            } else {
                habitacion.huespedes = [...habitacion.huespedes, huesped];
            }
            nuevas[index] = habitacion;
            return nuevas;
        });
    };

    const handleSeguirCargando = () => {
        if (habitacionActivaIndex < selecciones.length - 1) {
            setHabitacionActivaIndex(prev => prev + 1);
            limpiarFormularioHuesped();
        }
    };

    //  PROCESAMIENTO FINAL

    // Paso 1: Validacion Previa
    const iniciarProcesoGuardado = () => {
        if (!titularGlobal) {
            triggerAlert("warning", "Falta Titular", "Debe seleccionar un Titular responsable para el Check-In.");
            return;
        }

        // VALIDACION: Verificar si hay habitaciones vacías
        const habitacionesVacias = selecciones.filter(s => (s.huespedes?.length || 0) === 0);

        if (habitacionesVacias.length > 0) {
            // Obtener los números de las habitaciones vacías para mostrar en la alerta
            const numeros = habitacionesVacias.map(h => h.numero).join(", ");
            triggerAlert("error", "Faltan Huéspedes", `No se puede guardar. Las siguientes habitaciones no tienen huéspedes asignados: ${numeros}.`);
            return; // DETIENE EL PROCESO
        }

        // Si todo ok, guardamos directo
        ejecutarCheckInBackend();
    };

    // Paso 2: Llamada al Backend
    const ejecutarCheckInBackend = async () => {
        setLoading(true);

        // Aplanar lista de Habitaciones
        const listaIdsHabitaciones = selecciones.map(sel => sel.idHabitacion);

        // Aplanar lista de Huéspedes
        const setHuespedes = new Set<string>();
        setHuespedes.add(titularGlobal!.idHuesped);
        selecciones.forEach(sel => {
            if (sel.huespedes && sel.huespedes.length > 0) {
                sel.huespedes.forEach(h => setHuespedes.add(h.idHuesped));
            }
        });
        const listaIdsHuespedes = Array.from(setHuespedes);

        // Calcular noches
        const fechaInicio = selecciones[0].fechaDesde;
        const fechaFin = selecciones[0].fechaHasta;
        const d1 = new Date(fechaInicio);
        const d2 = new Date(fechaFin);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const payload = {
            checkIn: fechaInicio,
            checkOut: fechaFin,
            cantNoches: diffDays,
            idReserva: null, // Walk-in
            idsHabitaciones: listaIdsHabitaciones,
            idsHuespedes: listaIdsHuespedes,
            idHuespedTitular: titularGlobal!.idHuesped
        };

        try {
            const res = await fetch("http://localhost:8080/Estadia/CheckIn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setModalExitoOpen(true);
            } else {
                const errorText = await res.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    triggerAlert("error", "Error Check-In", errorJson.mensaje || errorText);
                } catch {
                    triggerAlert("error", "Error Check-In", errorText);
                }
            }
        } catch (error) {
            console.error(error);
            triggerAlert("error", "Error de Sistema", "No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    //  NUEVO FLUJO POST-EXITO
    const handleCargarOtra = () => {
        setSelecciones([]);
        setTitularGlobal(null);
        setListaHuespedes([]);
        setTempSelect({ start: null, end: null, roomId: null });
        setModalExitoOpen(false);
        setPaso("GRILLA");
        realizarBusquedaGrilla();
    };

    const handleFinalizarSalir = () => {
        window.location.reload();
    };

    // ===================== RENDER =====================
    return (
        <div className="container mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 pb-10 min-h-screen bg-gray-50/30">

            {/* HEADER */}
            <Card className="bg-white border-green-100 shadow-sm relative overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${paso === "GRILLA" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                            {paso === "GRILLA" ? <Clock className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {paso === "GRILLA" ? "Paso 1: Selección de Habitaciones" : "Paso 2: Asignación de Roles"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {paso === "GRILLA"
                                    ? "Seleccione rango de fechas (Inicio HOY)."
                                    : `Asigne el Titular del Check-In y los ocupantes de las ${selecciones.length} habitaciones.`}
                            </p>
                        </div>
                    </div>

                    {paso === "GRILLA" && (
                        <form onSubmit={handleBuscarDisponibilidad} className="flex gap-4 items-end mr-12 sm:mr-32 lg:mr-0">

                            <div className="w-32">
                                <label className="text-xs font-semibold text-gray-500">Tipo</label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-gray-100 px-3 py-1 text-sm focus:bg-white"
                                    value={tipoHabitacion}
                                    onChange={e => setTipoHabitacion(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    {TIPOS_HABITACION.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-32 sm:w-35">
                                <label className="text-xs font-semibold text-gray-500">Entrada</label>
                                <Input
                                    type="date"
                                    value={getTodayString()}
                                    disabled
                                    className="h-9 bg-gray-100 text-center px-2 text-sm"
                                />
                            </div>
                            <div className="w-32 sm:w-40">
                                <label className="text-xs font-semibold text-gray-500">Salida</label>
                                <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} min={getTomorrowString()} className="h-9 text-center" />
                            </div>
                            <Button size="sm" type="submit" className="bg-green-700 h-9 px-4">
                                <Search className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Consultar</span>
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* MODO GRILLA  */}
                {paso === "GRILLA" && (
                    <>
                        <div className="flex-1 space-y-4 min-w-0">
                            {searched ? (
                                <GrillaDisponibilidad
                                    data={gridData}
                                    loading={loading}
                                    tempSelection={tempSelect}
                                    finalSelections={selecciones.map((sel) => ({
                                        idHabitacion: sel.idHabitacion,
                                        fechaDesde: sel.fechaDesde,
                                        fechaHasta: sel.fechaHasta
                                    }))}
                                    onCellClick={handleCellClick}
                                    modo="checkin"
                                />
                            ) : (
                                <div className="text-center p-12 bg-gray-50 rounded-lg border-dashed border-2 text-gray-400 h-64 flex flex-col items-center justify-center">
                                    <Clock className="h-10 w-10 mb-2 opacity-20" />
                                    Presione "Consultar" para ver disponibilidad.
                                </div>
                            )}
                        </div>

                        {/* SIDEBAR DE GRILLA */}
                        {searched && gridData.length > 0 && (
                            <aside className="w-full lg:w-80 shrink-0 space-y-4 sticky top-6 animate-in slide-in-from-right duration-500">
                                {/* Panel Seleccion Actual */}
                                <Card className={`border-2 transition-all shadow-md ${tempSelect.roomId ? "border-blue-400 bg-blue-50/50" : "border-gray-100 bg-gray-50 opacity-80"}`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" /> Selección Actual
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {tempSelect.roomId ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                                                    <span className="font-bold text-blue-900">Hab {gridData.find((h) => h.habitacion.id_habitacion === tempSelect.roomId)?.habitacion.numero}</span>
                                                    <div className="text-xs text-right">
                                                        <div className="text-gray-500">Entrada: {formatearFecha(tempSelect.start!)}</div>
                                                        {tempSelect.end && <div className="text-gray-500">Salida: {formatearFecha(tempSelect.end)}</div>}
                                                    </div>
                                                </div>
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={intentarAgregarSeleccion} disabled={!tempSelect.end}>
                                                    {tempSelect.end ? "Agregar al Check-In" : "Seleccione fecha fin"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Haz click en la columna de <strong>HOY</strong> para comenzar.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Lista Carrito */}
                                <Card className="border-gray-200 shadow-sm h-fit max-h-[500px] flex flex-col">
                                    <CardHeader className="pb-3 border-b bg-gray-50">
                                        <CardTitle className="text-base font-semibold text-gray-800 flex justify-between items-center">
                                            <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Habitaciones</span>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{selecciones.length}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                        {selecciones.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-gray-400">Lista vacía.</div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {selecciones.map((sel, i) => (
                                                    <div key={i} className="p-3 hover:bg-gray-50 transition flex justify-between items-center group">
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                                Hab {sel.numero}
                                                                {sel.esOcuparIgual && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded border border-yellow-200">Ocupar</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                {formatearFecha(sel.fechaDesde)} <ArrowRight className="h-3 w-3" /> {formatearFecha(sel.fechaHasta)}
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => eliminarSeleccion(i)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                    {(selecciones.length > 0 || (tempSelect.start && tempSelect.end)) && (
                                        <div className="p-4 border-t bg-gray-50">
                                            <Button className="w-full bg-green-700 hover:bg-green-800 text-white shadow-md font-semibold" onClick={checkPendingAndContinue}>
                                                Continuar a Huéspedes <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    )}
                                </Card>

                                {/* BOToN CANCELAR */}
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors h-10 mt-2"
                                    onClick={() => setModalSalirOpen(true)}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar Check-In
                                </Button>

                            </aside>
                        )}
                    </>
                )}

                {/* MODO HUÉSPEDES  */}
                {paso === "HUESPEDES" && (
                    <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] animate-in fade-in">
                        {/* IZQUIERDA: LISTA HABITACIONES Y TITULAR */}
                        <Card className="w-full lg:w-1/3 flex flex-col border-green-200 shadow-md h-full">

                            {/* SECCIoN TITULAR */}
                            <div className="p-4 bg-green-50/80 border-b border-green-100">
                                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <UserCheck className="h-4 w-4" /> Titular Responsable
                                </div>
                                {titularGlobal ? (
                                    <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200 shadow-sm">
                                        <div className="truncate font-bold text-gray-800">{titularGlobal.apellido}, {titularGlobal.nombre}</div>
                                        <Button size="sm" variant="ghost" onClick={() => setTitularGlobal(null)} className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-red-500 italic p-2 border border-dashed border-red-200 rounded bg-red-50/50">
                                        Seleccione un huésped de la lista y haga click en "Asignar Titular".
                                    </div>
                                )}
                            </div>

                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                    <Bed className="h-5 w-5" /> Ocupación Habitaciones
                                </CardTitle>
                                <CardDescription className="text-xs">Seleccione una habitación para agregarle ocupantes.</CardDescription>
                            </CardHeader>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                                {selecciones.map((sel, idx) => {
                                    const isActive = idx === habitacionActivaIndex;
                                    const ocupantes = sel.huespedes || [];
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => { setHabitacionActivaIndex(idx); limpiarFormularioHuesped(); }}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer relative ${isActive ? "bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-200" : "bg-white border-gray-200 hover:border-blue-200"}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-gray-800 text-lg">Hab {sel.numero}</span>
                                                {isActive && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">Editando</span>}
                                            </div>
                                            <hr className="my-2 border-gray-200" />
                                            <div className="min-h-[20px]">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Huéspedes ({ocupantes.length}):</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {ocupantes.map((a) => (
                                                        <span key={a.idHuesped} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-700">
                                                            {a.apellido}
                                                        </span>
                                                    ))}
                                                    {ocupantes.length === 0 && <span className="text-[10px] text-gray-400 italic">Sin huéspedes asignados</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* BARRA DE ACCIONES INFERIOR */}
                            <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-3 justify-between items-center">
                                {/* IZQUIERDA */}
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={volverAGrilla} className="text-gray-700 border-gray-300 hover:bg-gray-100">
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Agregar otra habitación
                                    </Button>

                                    {selecciones.length > 1 && habitacionActivaIndex < selecciones.length - 1 && (
                                        <Button variant="secondary" onClick={handleSeguirCargando} className="bg-white border hover:bg-gray-100 text-gray-700 shadow-sm">
                                            Seguir a Siguiente Hab <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>

                                {/* DERECHA - BOTONES DE ACCIoN PRINCIPAL */}
                                <div className="flex gap-2">
                                    <Button
                                        className="bg-green-700 hover:bg-green-800 text-white shadow-md w-48"
                                        onClick={iniciarProcesoGuardado}
                                        disabled={loading || !titularGlobal}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar y Finalizar
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() => setModalSalirOpen(true)}
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* DERECHA: BÚSQUEDA Y BOTONES */}
                        <Card className="w-full lg:w-2/3 flex flex-col border-green-200 shadow-md h-full">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span className="flex items-center gap-2"><Search className="h-5 w-5" /> Buscar Personas</span>
                                    <span className="border border-blue-100 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-bold">
                                        Editando Ocupantes Hab: {selecciones[habitacionActivaIndex]?.numero}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <div className="px-6 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-end">
                                    {/* CAMPOS DE BÚSQUEDA  */}
                                    <div>
                                        <Input id="input-apellido" placeholder="Apellido" value={searchApellido} onChange={(e) => setSearchApellido(e.target.value.toUpperCase())} />
                                    </div>
                                    <div>
                                        <Input placeholder="Nombre" value={searchNombre} onChange={(e) => setSearchNombre(e.target.value.toUpperCase())} />
                                    </div>

                                    {/* NUEVO FILTRO TIPO DOC  */}
                                    <div>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            value={searchTipoDoc}
                                            onChange={(e) => setSearchTipoDoc(e.target.value)}
                                        >
                                            <option value="">Cualquier tipo doc</option>
                                            <option value="DNI">DNI</option>
                                            <option value="Pasaporte">Pasaporte</option>
                                            <option value="LE">LE</option>
                                            <option value="LC">LC</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Input placeholder="Nro Doc" value={searchDocumento} onChange={(e) => setSearchDocumento(e.target.value)} className="w-full" />
                                        <Button onClick={buscarHuesped} className="bg-blue-600 hover:bg-blue-700 text-white"><Search className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                            <hr className="border-gray-100" />
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar space-y-2">
                                {listaHuespedes.map((h) => {
                                    const isTitular = titularGlobal?.idHuesped === h.idHuesped;
                                    const isEnActiva = (selecciones[habitacionActivaIndex]?.huespedes || []).some((a) => a.idHuesped === h.idHuesped);

                                    return (
                                        <div key={h.idHuesped} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-md transition-all">
                                            <div>
                                                <div className="font-bold text-gray-800">{h.apellido}, {h.nombre}</div>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span>{h.tipoDocumento?.tipoDocumento}: {h.numDoc}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={isTitular ? "default" : "secondary"}
                                                    className={isTitular ? "bg-green-600" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}
                                                    onClick={() => setTitularGlobal(h)}
                                                    disabled={isTitular}
                                                >
                                                    {isTitular ? "Es Titular" : "Asignar Titular"}
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant={isEnActiva ? "destructive" : "outline"}
                                                    className={!isEnActiva ? "border-blue-200 text-blue-700 hover:bg-blue-50" : ""}
                                                    onClick={() => toggleHuespedEnActiva(h)}
                                                >
                                                    {isEnActiva ? "Quitar de Hab" : <><UserPlus className="h-3 w-3 mr-1" /> Agregar a Hab</>}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* MODALES  */}

            <ModalAlert
                open={modalAlert.open}
                type={modalAlert.type}
                title={modalAlert.title}
                message={modalAlert.msg}
                onOk={() => setModalAlert(prev => ({ ...prev, open: false }))}
                okText="Aceptar"
            />

            {/* 1. Modal de CONFLICTO (Grilla) */}
            <Dialog open={modalConflicto} onOpenChange={setModalConflicto}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Conflicto Reserva</DialogTitle><DialogDescription>Días reservados en la seleccion.</DialogDescription></DialogHeader>
                    <div className="bg-yellow-50 p-2 text-sm rounded max-h-32 overflow-auto">{conflictDetails.map((c, i) => <div key={i}>{formatearFecha(c.fecha)} - Reservada</div>)}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setModalConflicto(false)}>VOLVER</Button><Button className="bg-yellow-600 text-white" onClick={() => confirmarAgregar(true)}>OCUPAR IGUAL</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Modal SELECCIoN PENDIENTE */}
            <Dialog open={alertPendingOpen} onOpenChange={setAlertPendingOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Selección Pendiente</DialogTitle><DialogDescription>Tienes una habitación marcada en la grilla sin agregar a la lista.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="ghost" onClick={handleDiscardAndContinue} className="text-red-500">Descartar</Button><Button onClick={handleAddAndContinue}>Agregar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Modal SALIR (Cancelar) */}
            <Dialog open={modalSalirOpen} onOpenChange={setModalSalirOpen}>
                <DialogContent className="border-red-200 bg-red-50">
                    <DialogHeader>
                        <DialogTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Cancelar todo el proceso?
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            Se perderán todos los datos ingresados hasta ahora.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalSalirOpen(false)} className="border-red-200 text-red-700 hover:bg-red-100">
                            Volver
                        </Button>
                        <Button className="bg-red-700 hover:bg-red-800 text-white" onClick={() => window.location.reload()}>
                            Sí, Cancelar y Salir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5. Modal de ÉXITO */}
            <Dialog open={modalExitoOpen} onOpenChange={setModalExitoOpen}>
                <DialogContent className="border-green-200 bg-green-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ¡Check-In Exitoso!
                        </DialogTitle>
                        <DialogDescription className="text-green-700 pt-2">
                            Las habitaciones han sido registradas correctamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-gray-600 text-center font-medium">
                            ¿Desea cargar otro Check-In ahora?
                        </p>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleFinalizarSalir}
                            className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-100"
                        >
                            No, volver al inicio
                        </Button>
                        <Button
                            onClick={handleCargarOtra}
                            className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
                        >
                            Sí, cargar otro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}