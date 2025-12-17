"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ModalAlert from "@/components/modalAlert/modalAlert";
import { PayerForm } from "./ResponsablePago/PayerForm";
import { EstadiaDetalleDTO, PayerDTO, ItemFacturable, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";
import { generarFacturaPDF } from "@/src/utils/pdfGenerator";
import { Search, PlusCircle, AlertCircle, Loader2, RefreshCcw, Users as UsersIcon, Check as CheckIcon, FileText, Clock } from "lucide-react";

// --- IMPORTS ---
import { estadiaApi } from "@/src/api/estadia.api";
import { responsableApi } from "@/src/api/responsable.api";
import { facturacionApi } from "@/src/api/facturacion.api";

export function CheckOutPanel() {
    const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

    // --- Campos de Entrada ---
    const [searchRoom, setSearchRoom] = useState("");
    const [searchTime, setSearchTime] = useState("10:00"); // Por defecto 10:00 según enunciado

    const [estadiaData, setEstadiaData] = useState<EstadiaDetalleDTO | null>(null);
    const [selectedPayer, setSelectedPayer] = useState<PayerDTO | null>(null);
    const [searchCuit, setSearchCuit] = useState("");
    const [itemsToBill, setItemsToBill] = useState<ItemFacturable[]>([]);

    // Estados UI
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Refs para foco
    const roomInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    // --- MODALES ---
    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info'|'warning'|'error'|'success'; title: string; msg: string }>({ open: false, type: 'info', title: '', msg: '' });
    const [confirmFacturaOpen, setConfirmFacturaOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    // --- RESET ---
    const handleReset = () => {
        setStep(0);
        setSearchRoom("");
        setSearchTime("10:00");
        setEstadiaData(null);
        setSelectedPayer(null);
        setShowCreateForm(false);
        setItemsToBill([]);
    };

    // ---  BUSCAR ---
    const handleSearchHabitacion = async () => {
        // Validaciones explícitas
        let errores = [];
        if (!searchRoom) errores.push("Falta el número de habitación.");
        if (!searchTime) errores.push("Falta la hora de salida.");

        if (errores.length > 0) {
            triggerAlert("warning", "Datos Incompletos", errores.join(" "));

            if (!searchRoom) roomInputRef.current?.focus();
            else if (!searchTime) timeInputRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            // Enviamos también la hora para el cálculo de recargos
            const data = await estadiaApi.buscarPorHabitacion(searchRoom, searchTime);

            if (data && data.idEstadia) {
                if (data.items) {
                    data.items.forEach(i => i.seleccionado = true); // Pre-seleccionar todo
                }
                setEstadiaData(data);
                setItemsToBill(data.items || []);
                setStep(1); // Pasar a seleccionar responsable
            } else {
                triggerAlert("warning", "No encontrada", "No hay estadía activa en esa habitación.");
                roomInputRef.current?.focus();
            }
        } catch (error: any) {
            triggerAlert("error", "Error", error.message || "Error al buscar la estadía.");
        } finally {
            setLoading(false);
        }
    };

    // --- PASO DE RESPONSABLE ---
    const handleSearchCuit = async () => {
        if (!searchCuit) {
            triggerAlert("warning", "Dato faltante", "Ingrese un CUIT para buscar.");
            return;
        }
        setLoading(true);
        try {
            const found = await responsableApi.buscarPorCuit(searchCuit);
            if (found) {
                setSelectedPayer(found);
            } else {
                triggerAlert("info", "No encontrado", "No existe responsable con ese documento. Puede darlo de alta.");
                setSelectedPayer(null);
            }
        } catch (error) {
            triggerAlert("error", "Error", "Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE ITEMS ---
    const toggleItem = (id: string) => {
        setItemsToBill(prev => prev.map(item =>
            item.id === id ? { ...item, seleccionado: !item.seleccionado } : item
        ));
    };

    const calcularTotal = () => {
        return itemsToBill
            .filter(i => i.seleccionado)
            .reduce((acc, curr) => acc + (curr.precioUnitario * curr.cantidad), 0);
    };

    // Determinar tipo factura
    const determinarTipoFactura = () => {
            if (!selectedPayer) return "B";

            // 1. Normalizamos el texto
            const condicion = (selectedPayer.condicionIva || "").toUpperCase().trim();

            // 2. Verificamos si tiene CUIT
            const tieneCuit = selectedPayer.cuit && selectedPayer.cuit.length > 5; // Validación mínima de largo

            // 3. Comparamos
            if (condicion.includes("RESPONSABLE INSCRIPTO") && tieneCuit) {
                return "A";
            }

            return "B"; // Por defecto Consumidor Final o si falta CUIT
        };

    // --- CONFIRMACIÓN Y FACTURACIÓN ---
    const handlePreFacturar = () => {
        if (!estadiaData || !selectedPayer) return;

        // Verificar items tildados
        const itemsSeleccionados = itemsToBill.filter(i => i.seleccionado);
        if (itemsSeleccionados.length === 0) {
            triggerAlert("warning", "Selección Vacía", "Debe seleccionar al menos un ítem para facturar.");
            return;
        }

        setConfirmFacturaOpen(true);
    };

    const handleConfirmarFacturacion = async () => {
        setConfirmFacturaOpen(false);
        setLoading(true);

        const itemsSeleccionados = itemsToBill.filter(i => i.seleccionado);
        const totalCalculado = calcularTotal();
        const tipoFact = determinarTipoFactura();

        try {
            const resultado = await facturacionApi.generar({
                idEstadia: estadiaData!.idEstadia,
                idResponsable: selectedPayer!.idResponsable!,
                items: itemsSeleccionados.map(i => ({
                    idServicio: i.id,
                    descripcion: i.descripcion,
                    cantidad: i.cantidad,
                    monto: i.precioUnitario
                })),
                tipoFactura: tipoFact,
                total: totalCalculado
            });

            // Generar PDF
            generarFacturaPDF({
                numeroComprobante: resultado.numeroComprobante,
                fechaEmision: new Date().toLocaleDateString(),
                tipoFactura: tipoFact,
                cliente: selectedPayer!,
                items: itemsSeleccionados,
                total: totalCalculado
            });

            setStep(3); // Éxito
        } catch (error: any) {
            console.error(error);
            triggerAlert("error", "Fallo al Facturar", error.message || "Ocurrió un error interno.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE CANCELAR (Global) ---
    const handleCancelClick = () => {
        if (step === 0) {
            // Si no empezamos, solo limpiamos
            handleReset();
        } else {
            // Si hay datos, pedimos confirmación
            setCancelConfirmOpen(true);
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-md border-rose-100 bg-white">
                <CardHeader className="bg-rose-50/50 border-b border-rose-100 pb-4">
                    <CardTitle className="text-rose-950 text-2xl font-bold flex items-center gap-2">
                        Facturación & Check-Out
                        {step > 0 && <span className="text-lg font-normal text-gray-500 ml-2">| Habitación {estadiaData?.nroHabitacion}</span>}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        {step === 0 && "Ingrese los datos para buscar la estadía activa."}
                        {step === 1 && "Seleccione el responsable que abonará la factura."}
                        {step === 2 && "Verifique los items y confirme la operación."}
                        {step === 3 && "Operación finalizada correctamente."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 px-8 min-h-[400px]">
                    <div className="space-y-6">

                        {/* --- PASO 0: BÚSQUEDA --- */}
                        {step === 0 && (
                            <div className="max-w-xl mx-auto space-y-6 mt-8">
                                <div className="grid grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label>Número de Habitación *</Label>
                                        <Input
                                            ref={roomInputRef}
                                            placeholder="Ej: 101"
                                            value={searchRoom}
                                            onChange={e => setSearchRoom(e.target.value)}
                                            className="border-rose-200 focus:ring-rose-900 h-12 text-lg"
                                            onKeyDown={(e) => e.key === 'Enter' && timeInputRef.current?.focus()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora de Salida *</Label>
                                        <div className="relative">
                                            <Input
                                                ref={timeInputRef}
                                                type="time"
                                                value={searchTime}
                                                onChange={e => setSearchTime(e.target.value)}
                                                className="border-rose-200 focus:ring-rose-900 h-12 text-lg pl-10"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchHabitacion()}
                                            />
                                            <Clock className="absolute left-3 top-3.5 h-5 w-5 text-rose-800 pointer-events-none" />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSearchHabitacion}
                                        disabled={loading}
                                        className="col-span-2 bg-rose-900 hover:bg-rose-800 text-white font-semibold h-12 text-lg"
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 h-5 w-5"/>}
                                        {loading ? "Buscando..." : "Buscar Estadía"}
                                    </Button>
                                </div>
                                <div className="text-xs text-gray-400 text-center">
                                    * Campos obligatorios para el cálculo de recargos.
                                </div>
                            </div>
                        )}

                        {/* --- PASO 1: RESPONSABLE --- */}
                        {step === 1 && (
                            <div className="max-w-4xl mx-auto">
                                {showCreateForm ? (
                                    <PayerForm
                                        cuitInicial={searchCuit}
                                        onCancel={() => setShowCreateForm(false)}
                                        onSuccess={(p) => { setSelectedPayer(p); setShowCreateForm(false); }}
                                    />
                                ) : (
                                    <div className="space-y-8">
                                        {/* Ocupantes */}
                                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 shadow-sm">
                                            <h4 className="font-bold text-rose-900 mb-4 flex items-center gap-2 text-lg">
                                                <UsersIcon /> Ocupantes (Selección Rápida)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {estadiaData?.ocupantes?.map(occ => (
                                                    <div
                                                        key={occ.idResponsable || occ.dni}
                                                        onClick={() => { setSelectedPayer(occ); setSearchError(""); }}
                                                        className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center bg-white shadow-sm hover:shadow-md
                                                            ${selectedPayer?.idResponsable === occ.idResponsable ? 'border-rose-600 ring-2 ring-rose-600 ring-opacity-50' : 'hover:border-rose-300'}`}
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-800 block">{(occ as PersonaFisicaDTO).nombre} {(occ as PersonaFisicaDTO).apellido}</span>
                                                            <span className="text-sm text-gray-500 block">DNI: {(occ as PersonaFisicaDTO).dni}</span>
                                                        </div>
                                                        {selectedPayer?.idResponsable === occ.idResponsable && <CheckIcon className="text-rose-600" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Buscador Externo */}
                                        <div className="border-t pt-6">
                                            <Label className="mb-3 block text-gray-700 font-medium">Facturar a un tercero (CU07 Paso 5.B)</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    placeholder="Ingrese CUIT o DNI"
                                                    value={searchCuit}
                                                    onChange={e => setSearchCuit(e.target.value)}
                                                    className="h-10"
                                                    onKeyDown={(e) => e.key === "Enter" && handleSearchCuit()}
                                                />
                                                <Button onClick={handleSearchCuit} disabled={loading} className="bg-gray-800 text-white hover:bg-gray-700 px-6">
                                                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4 mr-2" />}
                                                    Buscar
                                                </Button>
                                                <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                                                    <PlusCircle className="w-4 h-4 mr-2"/> Nuevo
                                                </Button>
                                            </div>

                                            {selectedPayer && !estadiaData?.ocupantes?.find(o => o.idResponsable === selectedPayer.idResponsable) && (
                                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold flex justify-between items-center shadow-sm">
                                                    <span className="flex flex-col">
                                                        <span className="text-xs uppercase text-green-600 mb-1">Tercero Seleccionado</span>
                                                        <span className="text-lg">{selectedPayer.esPersonaJuridica ? (selectedPayer as PersonaJuridicaDTO).razonSocial : `${(selectedPayer as PersonaFisicaDTO).nombre} ${(selectedPayer as PersonaFisicaDTO).apellido}`}</span>
                                                    </span>
                                                    <CheckIcon className="text-green-600" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between pt-6 border-t">
                                            <Button variant="outline" onClick={handleCancelClick}>Cancelar</Button>
                                            <Button
                                                disabled={!selectedPayer}
                                                onClick={() => setStep(2)}
                                                className="bg-rose-900 hover:bg-rose-800 text-white px-8"
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- PASO 2: DETALLE Y CONFIRMACIÓN --- */}
                        {step === 2 && selectedPayer && (
                            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
                                {/* Cabecera Responsable */}
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Responsable de Pago</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {selectedPayer.esPersonaJuridica ? (selectedPayer as PersonaJuridicaDTO).razonSocial : `${(selectedPayer as PersonaFisicaDTO).nombre} ${(selectedPayer as PersonaFisicaDTO).apellido}`}
                                        </p>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {selectedPayer.esPersonaJuridica ? `CUIT: ${(selectedPayer as PersonaJuridicaDTO).cuit}` : `DNI: ${(selectedPayer as PersonaFisicaDTO).dni}`}
                                            <span className="mx-2">|</span>
                                            <span className="font-semibold">{selectedPayer.condicionIva}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-block px-4 py-2 bg-rose-100 text-rose-800 rounded-md font-bold border border-rose-200 shadow-sm">
                                            FACTURA TIPO "{determinarTipoFactura()}"
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Items */}
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <div className="bg-gray-100 p-3 border-b font-semibold text-sm grid grid-cols-12 text-gray-700">
                                        <div className="col-span-1 text-center">Sel.</div>
                                        <div className="col-span-7">Concepto</div>
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-2 text-right">Monto</div>
                                    </div>
                                    <div className="divide-y bg-white max-h-[350px] overflow-y-auto">
                                        {itemsToBill.map(item => (
                                            <div key={item.id} className={`grid grid-cols-12 p-4 text-sm items-center transition-colors ${item.seleccionado ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-400'}`}>
                                                <div className="col-span-1 flex justify-center">
                                                    <Checkbox
                                                        checked={item.seleccionado}
                                                        onCheckedChange={() => toggleItem(item.id)}
                                                    />
                                                </div>
                                                <div className="col-span-7 font-medium text-base">{item.descripcion}</div>
                                                <div className="col-span-2 text-center">{item.cantidad}</div>
                                                <div className="col-span-2 text-right font-mono font-medium">
                                                    $ {(item.precioUnitario * item.cantidad).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Total */}
                                    <div className="bg-rose-50 p-6 flex justify-between items-center border-t border-rose-100">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-rose-900 text-lg">TOTAL A PAGAR</span>
                                            {determinarTipoFactura() === 'A' && <span className="text-xs text-rose-600">(IVA Discriminado en Factura)</span>}
                                        </div>
                                        <span className="text-3xl font-bold text-rose-900">$ {calcularTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex justify-between pt-6">
                                    <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="px-6">Atrás</Button>
                                    <Button
                                        onClick={handlePreFacturar}
                                        disabled={loading || calcularTotal() === 0}
                                        className="bg-rose-900 hover:bg-rose-800 text-white px-8 h-12 text-lg shadow-md"
                                    >
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar y Facturar"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* --- PASO 3: ÉXITO --- */}
                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <CheckIconLarge />
                                </div>
                                <h3 className="text-3xl font-bold text-rose-900 mb-2">¡Facturación Exitosa!</h3>
                                <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
                                    La factura se ha generado en el sistema y el comprobante PDF se ha descargado.
                                </p>
                                <Button onClick={handleReset} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg shadow-lg flex items-center gap-2">
                                    <RefreshCcw className="w-5 h-5" />
                                    Nueva Facturación
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* --- MODALES EMERGENTES --- */}

            {/* 1. Alerta Genérica */}
            <ModalAlert
                open={modalAlert.open}
                type={modalAlert.type}
                title={modalAlert.title}
                message={modalAlert.msg}
                onOk={() => setModalAlert({...modalAlert, open: false})}
                okText="Aceptar"
            />

            {/* 2. Confirmación Cancelar */}
            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-rose-950">¿Cancelar Operación?</DialogTitle>
                        <DialogDescription>Se perderán los datos ingresados en el proceso de Check-Out.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>Seguir Editando</Button>
                        <Button variant="destructive" onClick={() => { setCancelConfirmOpen(false); handleReset(); }}>Sí, Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Confirmación Facturar */}
            <Dialog open={confirmFacturaOpen} onOpenChange={setConfirmFacturaOpen}>
                <DialogContent className="bg-green-50 border-green-200">
                    <DialogHeader>
                        <DialogTitle className="text-green-800 flex items-center gap-2">
                            <FileText className="h-5 w-5"/> Confirmar Facturación
                        </DialogTitle>
                        <DialogDescription className="text-green-700">
                            Se emitirá una <b>Factura Tipo {determinarTipoFactura()}</b> por un total de <b>${calcularTotal().toLocaleString()}</b>.
                            <br/><br/>
                            ¿Está seguro de finalizar el Check-Out?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmFacturaOpen(false)} className="border-green-200 text-green-800 hover:bg-green-100">Revisar</Button>
                        <Button className="bg-green-700 text-white hover:bg-green-800" onClick={handleConfirmarFacturacion}>Confirmar y Emitir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const CheckIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>;