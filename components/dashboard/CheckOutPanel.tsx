"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PayerForm } from "./ResponsablePago/PayerForm";
import { EstadiaDetalleDTO, PayerDTO, ItemFacturable, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";
import { generarFacturaPDF } from "@/src/utils/pdfGenerator";
import { Search, PlusCircle, AlertCircle, Loader2, RefreshCcw } from "lucide-react";

// --- IMPORTS ---
import { estadiaApi } from "@/src/api/estadia.api";
import { responsableApi } from "@/src/api/responsable.api";
import { facturacionApi } from "@/src/api/facturacion.api";

export function CheckOutPanel() {
    const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

    // Datos Búsqueda Habitación
    const [searchRoom, setSearchRoom] = useState("");
    const [searchTime, setSearchTime] = useState("10:00");
    const [estadiaData, setEstadiaData] = useState<EstadiaDetalleDTO | null>(null);

    // Responsable
    const [selectedPayer, setSelectedPayer] = useState<PayerDTO | null>(null);
    const [searchCuit, setSearchCuit] = useState("");
    const [searchError, setSearchError] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Items
    const [itemsToBill, setItemsToBill] = useState<ItemFacturable[]>([]);

    const [loading, setLoading] = useState(false);

    // --- LÓGICA DE RESETEO (Para nueva operación) ---
    const handleReset = () => {
        setStep(0);
        setSearchRoom("");
        setEstadiaData(null);
        setSelectedPayer(null);
        setShowCreateForm(false);
        setSearchError("");
        setItemsToBill([]);
    };

    // --- PASO 0: BUSCAR HABITACIÓN ---
    const handleSearchHabitacion = async () => {
        setLoading(true);
        try {
            const data = await estadiaApi.buscarPorHabitacion(searchRoom);

            if (data.items) {
                data.items.forEach(i => i.seleccionado = true);
            }

            setEstadiaData(data);
            setItemsToBill(data.items || []);
            setStep(1);
        } catch (error: any) {
            alert(error.message || "Error al buscar la estadía.");
        } finally {
            setLoading(false);
        }
    };

    // --- PASO 1: BUSCAR RESPONSABLE ---
    const handleSearchCuit = async () => {
        if (!searchCuit) {
            setSearchError("Ingrese un CUIT para buscar.");
            return;
        }
        setSearchError("");
        setLoading(true);

        try {
            const found = await responsableApi.buscarPorCuit(searchCuit);

            if (found) {
                setSelectedPayer(found);
            } else {
                setSearchError("No se encontró responsable con ese CUIT.");
                setSelectedPayer(null);
            }
        } catch (error) {
            setSearchError("Error de conexión al buscar.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewPayer = (newPayer: PayerDTO) => {
        setSelectedPayer(newPayer);
        setShowCreateForm(false);
        setSearchError("");
    };

    // --- PASO 2: LÓGICA DE ITEMS ---
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

    const determinarTipoFactura = () => {
        if (!selectedPayer) return "B";
        if (selectedPayer.condicionIva === "RESPONSABLE_INSCRIPTO") return "A";
        return "B";
    };

    // --- PASO FINAL: FACTURAR ---
    const handleFacturar = async () => {
        if (!estadiaData || !selectedPayer) return;
        setLoading(true);

        const itemsSeleccionados = itemsToBill.filter(i => i.seleccionado);
        const totalCalculado = calcularTotal();
        const tipoFact = determinarTipoFactura();

        try {
            // 1. REGISTRAR FACTURA EN BACKEND
            const resultado = await facturacionApi.generar({
                idEstadia: estadiaData.idEstadia,
                idResponsable: selectedPayer.idResponsable!,
                items: itemsSeleccionados.map(i => ({
                    idServicio: i.id,
                    descripcion: i.descripcion,
                    cantidad: i.cantidad,
                    monto: i.precioUnitario
                })),
                tipoFactura: tipoFact,
                total: totalCalculado
            });

            // 2. GENERAR PDF
            generarFacturaPDF({
                numeroComprobante: resultado.numeroComprobante,
                fechaEmision: new Date().toLocaleDateString(),
                tipoFactura: tipoFact,
                cliente: selectedPayer,
                items: itemsSeleccionados,
                total: totalCalculado
            });

            setStep(3);
        } catch (error: any) {
            console.error(error);
            alert("Error al facturar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-md border-rose-100">
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
                                        <Label>Número de Habitación</Label>
                                        <Input
                                            placeholder="Ej: 101"
                                            value={searchRoom}
                                            onChange={e => setSearchRoom(e.target.value)}
                                            className="border-rose-200 focus:ring-rose-900 h-12 text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora de Salida</Label>
                                        <Input
                                            type="time"
                                            value={searchTime}
                                            onChange={e => setSearchTime(e.target.value)}
                                            className="border-rose-200 focus:ring-rose-900 h-12 text-lg"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearchHabitacion}
                                        disabled={!searchRoom || loading}
                                        className="col-span-2 bg-rose-900 hover:bg-rose-800 text-white font-semibold h-12 text-lg"
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                        {loading ? "Buscando..." : "Buscar Estadía"}
                                    </Button>
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
                                        onSuccess={handleCreateNewPayer}
                                    />
                                ) : (
                                    <div className="space-y-8">
                                        {/* Ocupantes de la estadía */}
                                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 shadow-sm">
                                            <h4 className="font-bold text-rose-900 mb-4 flex items-center gap-2 text-lg">
                                                <UsersIcon /> Ocupantes (Selección Rápida)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {estadiaData?.ocupantes?.length === 0 && <p className="text-sm text-gray-500 italic col-span-2">No hay ocupantes registrados.</p>}
                                                {estadiaData?.ocupantes?.map(occ => (
                                                    <div
                                                        key={occ.idResponsable || occ.dni}
                                                        onClick={() => { setSelectedPayer(occ); setSearchError(""); setSearchCuit(""); }}
                                                        className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center bg-white shadow-sm hover:shadow-md
                                                            ${selectedPayer?.idResponsable === occ.idResponsable ? 'border-rose-600 ring-2 ring-rose-600 ring-opacity-50' : 'hover:border-rose-300'}`}
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-800 block">{(occ as PersonaFisicaDTO).nombre} {(occ as PersonaFisicaDTO).apellido}</span>
                                                            <span className="text-sm text-gray-500 block">DNI: {(occ as PersonaFisicaDTO).dni}</span>
                                                        </div>
                                                        {selectedPayer?.idResponsable === occ.idResponsable && <CheckIcon />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Buscador de Terceros */}
                                        <div className="border-t pt-6">
                                            <Label className="mb-3 block text-gray-700 font-medium">Facturar a un tercero</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    placeholder="Ingrese CUIT o DNI"
                                                    value={searchCuit}
                                                    onChange={e => setSearchCuit(e.target.value)}
                                                    className={`h-10 ${searchError ? "border-red-500" : ""}`}
                                                    onKeyDown={(e) => e.key === "Enter" && handleSearchCuit()}
                                                />
                                                <Button onClick={handleSearchCuit} disabled={loading} className="bg-gray-800 text-white hover:bg-gray-700 px-6">
                                                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4 mr-2" />}
                                                    Buscar
                                                </Button>
                                            </div>

                                            {searchError && (
                                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-center justify-between animate-in fade-in">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-5 h-5" />
                                                        {searchError}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-300 hover:bg-red-100 text-red-900 bg-white"
                                                        onClick={() => setShowCreateForm(true)}
                                                    >
                                                        <PlusCircle className="w-4 h-4 mr-2" />
                                                        Dar de Alta
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Visualización de seleccionado externo */}
                                            {selectedPayer && !estadiaData?.ocupantes?.find(o => o.idResponsable === selectedPayer.idResponsable) && (
                                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold flex justify-between items-center shadow-sm">
                                                    <span className="flex flex-col">
                                                        <span className="text-xs uppercase text-green-600 mb-1">Responsable Externo Seleccionado</span>
                                                        <span className="text-lg">{selectedPayer.esPersonaJuridica ? (selectedPayer as PersonaJuridicaDTO).razonSocial : `${(selectedPayer as PersonaFisicaDTO).nombre} ${(selectedPayer as PersonaFisicaDTO).apellido}`}</span>
                                                    </span>
                                                    <CheckIcon />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end pt-6 border-t gap-3">
                                            <Button variant="outline" onClick={handleReset}>Cancelar</Button>
                                            <Button
                                                disabled={!selectedPayer}
                                                onClick={() => setStep(2)}
                                                className="bg-rose-900 hover:bg-rose-800 text-white px-8"
                                            >
                                                Siguiente: Detalle de Factura
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- PASO 2: ITEMS --- */}
                        {step === 2 && selectedPayer && (
                            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
                                {/* Cabecera Responsable Resumida */}
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Responsable de Pago</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {selectedPayer.esPersonaJuridica ? (selectedPayer as PersonaJuridicaDTO).razonSocial : `${(selectedPayer as PersonaFisicaDTO).nombre} ${(selectedPayer as PersonaFisicaDTO).apellido}`}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            {selectedPayer.esPersonaJuridica ? `CUIT: ${(selectedPayer as PersonaJuridicaDTO).cuit}` : `DNI: ${(selectedPayer as PersonaFisicaDTO).dni}`}
                                        </p>
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
                                        <div className="col-span-7">Descripción</div>
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-2 text-right">Subtotal</div>
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
                                        <span className="font-bold text-rose-900 text-lg">TOTAL A PAGAR</span>
                                        <span className="text-2xl font-bold text-rose-900">$ {calcularTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex justify-between pt-6">
                                    <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="px-6">Atrás</Button>
                                    <Button
                                        onClick={handleFacturar}
                                        disabled={loading || calcularTotal() === 0}
                                        className="bg-rose-900 hover:bg-rose-800 text-white px-8 h-12 text-lg shadow-md"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : "Confirmar y Facturar"}
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
        </div>
    );
}

// Iconos Auxiliares
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><polyline points="20 6 9 17 4 12"/></svg>;
const CheckIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>;