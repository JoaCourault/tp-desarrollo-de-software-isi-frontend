"use client";

import { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";
import { ModificarHuespedRequestDTO } from "@/src/dto/Huesped/ModificarHuespedRequest.dto";
import { HuespedApi } from "@/src/api/huesped.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalAlert from "@/components/modalAlert/modalAlert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HuespedFormProps {
    initialData?: HuespedDTO | null;
    onBack: (shouldRefresh: boolean) => void;
    onCancel: () => void;
}

// --- UTILIDADES ---
const formatDateForInput = (val: string | number[] | undefined | null): string => {
    if (!val) return "";
    if (Array.isArray(val)) {
        const [year, month, day] = val;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    const date = new Date(val as string);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
};

const handleTextInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
};

const handleNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
};

export function HuespedForm({ initialData, onBack, onCancel }: HuespedFormProps) {
    const api = new HuespedApi();
    const formRef = useRef<HTMLFormElement>(null); // Referencia para limpiar el formulario
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para Alertas Generales (Errores, warnings)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [onOkAction, setOnOkAction] = useState<(() => void) | null>(null);

    // Estado para alerta de duplicados
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<AltaHuespedRequestDTO | ModificarHuespedRequestDTO | null>(null);

    // NUEVOS ESTADOS: Para el flujo de "¿Cargar otro?"
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [createdGuestName, setCreatedGuestName] = useState("");

    const isEditing = !!initialData;
    const formTitle = isEditing ? "Modificar Huésped" : "Alta de Huésped";

    const fechaNacimientoValue = formatDateForInput(
        (initialData as any)?.fechaNac || initialData?.fechaNacimiento
    );

    const showAlert = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, onOk?: () => void) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        if (onOk) setOnOkAction(() => onOk); else setOnOkAction(null);
        setModalOpen(true);
    };

    const submitAction = async (payload: AltaHuespedRequestDTO | ModificarHuespedRequestDTO) => {
        setIsSubmitting(true);
        try {
            const res = isEditing
                ? await api.modificar(payload as ModificarHuespedRequestDTO)
                : await api.alta(payload as AltaHuespedRequestDTO);

            if (res.resultado.id === 0) {
                // ÉXITO
                if (isEditing) {
                    // Si es edición, flujo normal: vuelve atrás
                    showAlert("success", "Operación Exitosa", "Datos actualizados correctamente.", () => onBack(true));
                } else {
                    // Si es ALTA, flujo especial: preguntar si cargar otro
                    setCreatedGuestName(`${payload.huesped.nombre} ${payload.huesped.apellido}`);
                    setSuccessDialogOpen(true);
                    setPendingPayload(null);
                }
            } else if (res.resultado.id === 3) {
                // DUPLICADO
                setPendingPayload(payload);
                setConfirmOpen(true);
            } else {
                // ERROR
                showAlert("error", "Error", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            showAlert("error", "Error de Conexión", "No se pudo conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);
        const cpVal = data.get("codigoPostal");
        const numVal = data.get("numero");

        if (!cpVal || Number(cpVal) <= 0) { showAlert("warning", "Datos incorrectos", "El CP debe ser positivo."); return; }

        const huespedDTO: HuespedDTO = {
            idHuesped: isEditing ? initialData!.idHuesped : null,
            nombre: String(data.get("nombre") ?? ""),
            apellido: String(data.get("apellido") ?? ""),
            tipoDocumento: { tipoDocumento: String(data.get("tipoDocumento") ?? "") },
            numDoc: String(data.get("numDoc") ?? ""),
            posicionIva: String(data.get("posicionIva") ?? ""),
            cuit: String(data.get("cuit") ?? "") || null,
            fechaNacimiento: String(data.get("fechaNacimiento") ?? ""),
            telefono: String(data.get("telefono") ?? ""),
            email: String(data.get("email") ?? ""),
            ocupacion: String(data.get("ocupacion") ?? ""),
            nacionalidad: String(data.get("nacionalidad") ?? ""),
            direccion: {
                id: isEditing && initialData?.direccion?.id ? initialData.direccion.id : null,
                calle: String(data.get("calle") ?? ""),
                numero: String(numVal),
                departamento: String(data.get("departamento") ?? "") || null,
                piso: String(data.get("piso") ?? "") || null,
                codigoPostal: String(cpVal),
                localidad: String(data.get("localidad") ?? ""),
                provincia: String(data.get("provincia") ?? ""),
                pais: String(data.get("pais") ?? ""),
            },
            idsEstadias: [],
            eliminado: false
        };

        const payload = { aceptarIgualmente: false, huesped: huespedDTO };
        await submitAction(payload);
    };

    const handleConfirmarDuplicado = async () => {
        if (!pendingPayload) return;
        setConfirmOpen(false);
        await submitAction({ ...pendingPayload, aceptarIgualmente: true });
    };

    // Resetea el formulario para cargar uno nuevo
    const handleResetForm = () => {
        setSuccessDialogOpen(false);
        if (formRef.current) {
            formRef.current.reset();
        }
        setPendingPayload(null);
    };

    return (
        <>
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => onBack(false)} className="hover:bg-rose-100 text-rose-900"><ArrowLeft className="h-5 w-5" /></Button>
                <div><h2 className="text-lg font-semibold text-rose-950">{formTitle}</h2><p className="text-sm text-gray-600">{isEditing ? "Modifique los datos necesarios." : "Complete el formulario para un nuevo huésped."}</p></div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 space-y-6 animate-in slide-in-from-right duration-300">
                {/* Inputs Personales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Apellido *</label><Input name="apellido" required defaultValue={initialData?.apellido || ""} onInput={handleTextInput} className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nombre *</label><Input name="nombre" required defaultValue={initialData?.nombre || ""} onInput={handleTextInput} className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Tipo Doc. *</label><select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required defaultValue={initialData?.tipoDocumento?.tipoDocumento || "DNI"}><option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="LE">LE</option><option value="LC">LC</option></select></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número Doc. *</label><Input name="numDoc" required defaultValue={initialData?.numDoc || ""} className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CUIT</label><Input name="cuit" defaultValue={initialData?.cuit || ""} className="bg-white" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Fecha Nac. *</label><Input name="fechaNacimiento" type="date" required defaultValue={fechaNacimientoValue} className="bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Posición IVA *</label><select name="posicionIva" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required defaultValue={initialData?.posicionIva || "Consumidor Final"}><option>Consumidor Final</option><option>Responsable Inscripto</option><option>Monotributista</option></select></div>
                </div>

                {/* Inputs Dirección */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5"><label className="text-sm font-medium text-gray-700">Calle *</label><Input name="calle" required defaultValue={initialData?.direccion?.calle || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Número *</label><Input name="numero" type="number" min={1} required defaultValue={initialData?.direccion?.numero || ""} className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Depto</label><Input name="departamento" defaultValue={initialData?.direccion?.departamento || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Piso</label><Input name="piso" defaultValue={initialData?.direccion?.piso || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CP *</label><Input name="codigoPostal" type="number" required defaultValue={initialData?.direccion?.codigoPostal || (initialData?.direccion as any)?.cp || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Localidad *</label><Input name="localidad" required defaultValue={initialData?.direccion?.localidad || ""} className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Provincia *</label><Input name="provincia" required defaultValue={initialData?.direccion?.provincia || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">País *</label><Input name="pais" required defaultValue={initialData?.direccion?.pais || ""} className="bg-white" /></div>
                    </div>
                </div>

                {/* Inputs Otros */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Teléfono *</label><Input name="telefono" required defaultValue={initialData?.telefono || ""} onInput={handleNumberInput} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Email</label><Input name="email" type="email" defaultValue={initialData?.email || ""} className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nacionalidad *</label><Input name="nacionalidad" required defaultValue={initialData?.nacionalidad || ""} onInput={handleTextInput} className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Ocupación *</label><Input name="ocupacion" required defaultValue={initialData?.ocupacion || ""} onInput={handleTextInput} className="bg-white" /></div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6">
                    <Button type="button" variant="outline" onClick={onCancel} className="text-rose-900 border-rose-200 hover:bg-rose-50">Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-rose-900 hover:bg-rose-800 text-white min-w-[120px]">{isSubmitting ? "Guardando..." : "Guardar"}</Button>
                </div>
            </form>

            <ModalAlert open={modalOpen} title={modalTitle} message={modalMessage} type={modalType} onOk={() => { setModalOpen(false); if (onOkAction) onOkAction(); }} okText="Aceptar" />

            {/* ALERTA: DUPLICADO */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-amber-50 border-amber-200">
                    <AlertDialogHeader><AlertDialogTitle className="text-amber-800">Huésped Existente</AlertDialogTitle><AlertDialogDescription className="text-amber-700">Ya existe un huésped con ese documento. ¿Desea continuar igualmente?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => { setPendingPayload(null); setConfirmOpen(false); }} className="border-amber-200 text-amber-900">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmarDuplicado} className="bg-amber-600 hover:bg-amber-700 text-white">Sí, crear igualmente</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ALERTA: ÉXITO ALTA Y PREGUNTA SI CARGAR OTRO */}
            <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <AlertDialogContent className="bg-green-50 border-green-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-green-900">Alta Exitosa</AlertDialogTitle>
                        <AlertDialogDescription className="text-green-800">
                            El huésped: <strong>{createdGuestName}</strong> ha sido cargado correctamente. <br />
                            ¿Desea cargar otro?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => onBack(true)} className="border-green-200 text-green-900 hover:bg-green-100">
                            No
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetForm} className="bg-green-700 hover:bg-green-800 text-white border-green-800">
                            Sí, cargar otro
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}