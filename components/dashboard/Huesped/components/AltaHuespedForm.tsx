"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Importamos Card
import ModalAlert from "@/components/modalAlert/modalAlert";
import { HuespedApi } from "@/src/api/huesped.api";
import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";

// REGEX ORIGINAL
const REGEX = {
    LETRAS_ESPACIOS: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
    NUMEROS: /^[0-9]+$/,
    NUMEROS_GUIONES: /^[0-9\-]+$/,
    ALFANUMERICO_ESPACIOS: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/,
    ALFANUMERICO: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+$/,
    TELEFONO: /^\+?[0-9]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

interface AltaHuespedFormProps {
    onBack: () => void;
}

export function AltaHuespedForm({ onBack }: AltaHuespedFormProps) {
    const api = new HuespedApi();
    const formRef = useRef<HTMLFormElement>(null);

    const [modalAlert, setModalAlert] = useState<{ open: boolean; type: 'info'|'warning'|'error'|'success'; title: string; msg: string }>({ open: false, type: 'info', title: '', msg: '' });
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

    // Estado para manejar la vista de éxito con los datos del huésped creado
    const [createdGuest, setCreatedGuest] = useState<{ nombre: string; apellido: string } | null>(null);

    const [pendingPayload, setPendingPayload] = useState<AltaHuespedRequestDTO | null>(null);
    const [currentPayload, setCurrentPayload] = useState<AltaHuespedRequestDTO | null>(null);

    const triggerAlert = (type: 'info'|'warning'|'error'|'success', title: string, msg: string) => {
        setModalAlert({ open: true, type, title, msg });
    };

    const getVal = (data: FormData, name: string) => {
        const val = data.get(name);
        return val ? String(val).trim() : "";
    };

    const validarCampos = (data: FormData): string | null => {
        const apellido = getVal(data, "apellido");
        const nombre = getVal(data, "nombre");
        const numDoc = getVal(data, "numDoc");
        const cp = getVal(data, "cp");

        if (!apellido || !REGEX.LETRAS_ESPACIOS.test(apellido)) return "El apellido es obligatorio (solo letras).";
        if (!nombre || !REGEX.LETRAS_ESPACIOS.test(nombre)) return "El nombre es obligatorio (solo letras).";
        if (!numDoc || !REGEX.NUMEROS.test(numDoc)) return "El número de documento debe ser numérico.";

        if (!cp || !REGEX.ALFANUMERICO.test(cp)) return "El CP es obligatorio (letras y números).";

        return null;
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);

        const error = validarCampos(data);
        if (error) {
            triggerAlert("warning", "Datos Inválidos", error);
            return;
        }

        const payload: AltaHuespedRequestDTO = {
            aceptarIgualmente: false,
            huesped: {
                idHuesped: null,
                nombre: getVal(data, "nombre"),
                apellido: getVal(data, "apellido"),
                tipoDoc: { tipoDocumento: getVal(data, "tipoDocumento") },
                numDoc: getVal(data, "numDoc"),
                posicionIva: getVal(data, "posicionIva"),
                cuit: getVal(data, "cuit") || null,
                fechaNac: getVal(data, "fechaNacimiento"),
                telefono: getVal(data, "telefono"),
                email: getVal(data, "email"),
                ocupacion: getVal(data, "ocupacion"),
                nacionalidad: getVal(data, "nacionalidad"),
                direccion: {
                    calle: getVal(data, "calle"),
                    numero: getVal(data, "numero"),
                    departamento: getVal(data, "departamento"),
                    piso: getVal(data, "piso"),
                    codigoPostal: getVal(data, "cp"),
                    localidad: getVal(data, "localidad"),
                    provincia: getVal(data, "provincia"),
                    pais: getVal(data, "pais"),
                    id: null,
                },
                idsEstadias: [],
                eliminado: false,
            },
        };

        setCurrentPayload(payload);
        setSaveConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        setSaveConfirmOpen(false);
        if (currentPayload) await enviarAlta(currentPayload);
    };

    const enviarAlta = async (payload: AltaHuespedRequestDTO) => {
        try {
            const res = await api.alta(payload);
            if (res.resultado.id === 0) {
                setDuplicateModalOpen(false);
                setPendingPayload(null);

                // CAMBIO: En lugar de abrir modal, seteamos el huésped creado para mostrar la Card
                setCreatedGuest({
                    nombre: payload.huesped.nombre,
                    apellido: payload.huesped.apellido
                });

            } else if (res.resultado.id === 3) {
                setPendingPayload(payload);
                setDuplicateModalOpen(true);
            } else {
                triggerAlert("error", "Error", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            triggerAlert("error", "Error", "Error inesperado al guardar.");
        }
    };

    const handleConfirmarDuplicado = () => {
        if (pendingPayload) {
            enviarAlta({ ...pendingPayload, aceptarIgualmente: true });
        }
    };

    const handleLoadAnother = () => {
        formRef.current?.reset();
        setCreatedGuest(null); // Volvemos a mostrar el formulario
        setCurrentPayload(null);
        setPendingPayload(null);
    };

    // --- VISTA DE ÉXITO (CARD) ---
    if (createdGuest) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-in zoom-in-95 duration-300 min-h-[500px]">
                <Card className="w-full max-w-md border-green-200 bg-green-50 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">¡Huésped Creado!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-green-700 text-lg">
                            El huésped <span className="font-bold">{createdGuest.nombre} {createdGuest.apellido}</span> ha sido creado exitosamente.
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                onClick={handleLoadAnother}
                                className="bg-green-600 hover:bg-green-700 text-white w-full h-12 text-md"
                            >
                                <UserPlus className="mr-2 h-5 w-5" />
                                Cargar otro huésped
                            </Button>

                            <Button
                                variant="outline"
                                onClick={onBack}
                                className="border-green-200 text-green-700 hover:bg-green-100 w-full h-12"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al inicio
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- VISTA DE FORMULARIO ---
    return (
        <>
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setCancelConfirmOpen(true)} className="hover:bg-rose-100 text-rose-900">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-lg font-semibold text-rose-950">Formulario de Alta</h2>
                    <p className="text-sm text-gray-600">Ingrese los datos personales del nuevo huésped</p>
                </div>
            </div>

            <form ref={formRef} onSubmit={handlePreSubmit} className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Apellido *</label><Input name="apellido" placeholder="Ingrese apellido" required className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nombre *</label><Input name="nombre" placeholder="Ingrese nombre" required className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Tipo Doc. *</label><select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required><option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="LE">LE</option><option value="LC">LC</option></select></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número Doc. *</label><Input name="numDoc" placeholder="Ingrese número" required className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CUIT</label><Input name="cuit" placeholder="XX-XXXXXXXX-X" className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Fecha Nac. *</label><Input name="fechaNacimiento" type="date" required className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Posición IVA *</label><select name="posicionIva" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required><option>Consumidor Final</option><option>Responsable Inscripto</option></select></div>
                </div>
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5"><label className="text-sm font-medium text-gray-700">Calle *</label><Input name="calle" placeholder="Nombre de la calle" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número *</label><Input name="numero" placeholder="123" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Depto</label><Input name="departamento" placeholder="-" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Piso</label><Input name="piso" placeholder="-" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CP *</label><Input name="cp" required placeholder="0000" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Localidad *</label><Input name="localidad" placeholder="Localidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Provincia *</label><Input name="provincia" placeholder="Provincia" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">País *</label><Input name="pais" placeholder="País" required className="bg-white" /></div>
                    </div>
                </div>
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Teléfono *</label><Input name="telefono" placeholder="+54 11 ..." required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Email</label><Input name="email" type="email" placeholder="ejemplo@mail.com" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nacionalidad *</label><Input name="nacionalidad" placeholder="Nacionalidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Ocupación *</label><Input name="ocupacion" placeholder="Ocupación" required className="bg-white" /></div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6 pb-6">
                    <Button type="button" variant="outline" onClick={() => setCancelConfirmOpen(true)}>Cancelar</Button>
                    <Button type="submit" className="bg-rose-900 text-white"><Save className="h-4 w-4 mr-2" /> Guardar Huésped</Button>
                </div>
            </form>

            <ModalAlert open={modalAlert.open} title={modalAlert.title} message={modalAlert.msg} type={modalAlert.type} onOk={() => setModalAlert(prev => ({...prev, open: false}))} okText="Aceptar" />

            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>¿Cancelar Alta?</DialogTitle><DialogDescription>Se perderán los datos.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>No, seguir</Button><Button variant="destructive" onClick={onBack}>Sí, cancelar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
                <DialogContent className="bg-green-50 border-green-200">
                    <DialogHeader><DialogTitle className="text-green-800 flex gap-2"><CheckCircle2/> Confirmar Creación</DialogTitle><DialogDescription>¿Desea dar de alta este huésped?</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setSaveConfirmOpen(false)}>Volver</Button><Button onClick={handleConfirmSave} className="bg-green-700 text-white">Confirmar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
                <DialogContent className="bg-yellow-50 border-yellow-200">
                    <DialogHeader><DialogTitle className="text-yellow-800"><AlertTriangle/> Huésped Existente</DialogTitle><DialogDescription>El documento ya existe. ¿Desea continuar?</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setDuplicateModalOpen(false)}>Corregir</Button><Button onClick={handleConfirmarDuplicado} className="bg-yellow-600 text-white">Aceptar Igualmente</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}