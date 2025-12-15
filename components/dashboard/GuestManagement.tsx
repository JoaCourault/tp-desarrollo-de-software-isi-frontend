"use client";

import { useState } from "react";
import {
    UserPlus,
    Users,
    Search as SearchIcon,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    X, 
    Construction,
    ArrowLeft
} from "lucide-react";

import { HuespedApi } from "@/src/api/huesped.api";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";

// --- COMPONENTES UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalAlert from "@/components/modalAlert/modalAlert";

// INTERFAZ DE PROPS
interface GuestManagementProps {
    onGuestSelected?: (huesped: HuespedDTO) => void;
}

// COMPONENTE PRINCIPAL
export function GuestManagement({ onGuestSelected }: GuestManagementProps) {

    const [activeTab, setActiveTab] = useState<"alta" | "buscar" | "modificar">("alta");
    const [guestToModify, setGuestToModify] = useState<HuespedDTO | null>(null);

    // Navegar al Alta (CU11)
    const handleNavigateToAlta = () => {
        setActiveTab("alta");
    };

    // Navegar a Modificar (CU10 - En Construcción)
    const handleNavigateToModificar = (huesped: HuespedDTO) => {
        setGuestToModify(huesped);
        setActiveTab("modificar");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* SUB-NAVEGACIÓN */}
            {activeTab !== "modificar" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab("alta")}
                        className={`flex flex-col items-center justify-center border rounded-lg py-4 px-4 text-sm sm:text-base transition-all duration-200 ${
                            activeTab === "alta"
                                ? "bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-200 ring-offset-1"
                                : "bg-white text-rose-900 hover:bg-rose-50 border-rose-100 hover:border-rose-200"
                        }`}
                    >
                        <UserPlus className={`h-5 w-5 mb-2 ${activeTab === "alta" ? "text-white" : "text-rose-700"}`} />
                        <span className="font-medium">Dar Alta Huésped</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("buscar")}
                        className={`flex flex-col items-center justify-center border rounded-lg py-4 px-4 text-sm sm:text-base transition-all duration-200 ${
                            activeTab === "buscar"
                                ? "bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-200 ring-offset-1"
                                : "bg-white text-rose-900 hover:bg-rose-50 border-rose-100 hover:border-rose-200"
                        }`}
                    >
                        <Users className={`h-5 w-5 mb-2 ${activeTab === "buscar" ? "text-white" : "text-rose-700"}`} />
                        <span className="font-medium">Buscar Huésped</span>
                    </button>
                </div>
            )}

            {/* CONTENIDO */}
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden min-h-[400px]">
                {activeTab === "alta" && (
                    <AltaHuespedForm onGuestCreated={(h) => {
                        if (onGuestSelected) onGuestSelected(h);
                        else handleNavigateToModificar(h);
                    }} />
                )}
                
                {activeTab === "buscar" && (
                    <BuscarHuespedForm 
                        onSelect={(h) => {
                            if (onGuestSelected) onGuestSelected(h);
                            else handleNavigateToModificar(h);
                        }} 
                        onRequestAlta={handleNavigateToAlta} 
                    />
                )}

                {activeTab === "modificar" && (
                    <ConstructionPage 
                        huesped={guestToModify} 
                        onBack={() => setActiveTab("buscar")} 
                    />
                )}
            </div>
        </div>
    );
}

// --- PANTALLA EN CONSTRUCCIÓN ---
function ConstructionPage({ huesped, onBack }: { huesped: HuespedDTO | null, onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center space-y-6">
            <div className="bg-amber-50 p-6 rounded-full">
                <Construction className="h-16 w-16 text-amber-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Modificar Huésped en Construcción</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Has seleccionado a <span className="font-semibold text-rose-900">{huesped?.apellido}, {huesped?.nombre}</span>. 
                    <br />
                    El módulo para editar sus datos está siendo desarrollado actualmente.
                </p>
            </div>
            <Button onClick={onBack} variant="outline" className="mt-4 border-rose-200 text-rose-900 hover:bg-rose-50">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a buscar
            </Button>
        </div>
    );
}

// --- FORMULARIO DE ALTA (CU09) ---

interface AltaHuespedFormProps {
    onGuestCreated?: (huesped: HuespedDTO) => void;
}

function AltaHuespedForm({ onGuestCreated }: AltaHuespedFormProps) {
    const api = new HuespedApi();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    
    // Estados Flujo
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<AltaHuespedRequestDTO | null>(null);
    const [createdGuest, setCreatedGuest] = useState<HuespedDTO | null>(null);

    const showAlert = (
        type: 'info' | 'success' | 'warning' | 'error',
        title: string,
        message: string
    ) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    // --- HELPERS DE VALIDACIÓN ---

    // 1. Solo letras y espacios (Nombre, Pais, etc). Rechaza números y símbolos.
    const isValidText = (text: string) => {
        return /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(text);
    };

    // 2. Letras, Números y espacios (Calle, DNI). Rechaza símbolos (. , - /).
    const isValidAlphaNumeric = (text: string) => {
        return /^[a-zA-Z0-9À-ÿ\u00f1\u00d1\s]+$/.test(text);
    };

    const sendPayload = async (payload: AltaHuespedRequestDTO, formToReset?: HTMLFormElement) => {
        try {
            const res = await api.alta(payload);
            
            // 0 = ÉXITO
            if (res.resultado.id === 0) {
                setCreatedGuest(res.huesped);
                setDuplicateModalOpen(false); 
                setPendingPayload(null); 
                setShowSuccessModal(true);
                if (formToReset) formToReset.reset();
            } 
            // 3 = DUPLICADO REAL (Ahora coincide con el backend)
            else if (res.resultado.id === 3) {
                setPendingPayload(payload); 
                setDuplicateModalOpen(true); 
            }
            // 2 = ERROR DE VALIDACIÓN (Falta dato, fecha mal, etc)
            else if (res.resultado.id === 2) {
                showAlert("warning", "Datos Incorrectos", res.resultado.mensaje);
            }
            // 1 u otros = ERROR INTERNO
            else {
                showAlert("error", "Error", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            showAlert("error", "Error inesperado", "Ocurrió un error inesperado al guardar el huésped.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);

        // 1. Obtener valores
        const cpVal = data.get("cp");
        const numVal = data.get("numero");
        const posicionIva = String(data.get("posicionIva") ?? "");
        const cuitRaw = data.get("cuit");
        const cuit = cuitRaw ? String(cuitRaw).trim() : "";

        // 2. VALIDACIÓN: SOLO TEXTO (Sin números ni símbolos)
        const textFieldsToCheck = [
            { val: String(data.get("nombre") ?? ""), label: "Nombre" },
            { val: String(data.get("apellido") ?? ""), label: "Apellido" },
            { val: String(data.get("nacionalidad") ?? ""), label: "Nacionalidad" },
            { val: String(data.get("ocupacion") ?? ""), label: "Ocupación" },
            { val: String(data.get("pais") ?? ""), label: "País" },
            { val: String(data.get("provincia") ?? ""), label: "Provincia" },
            { val: String(data.get("localidad") ?? ""), label: "Localidad" },
        ];

        for (const field of textFieldsToCheck) {
            if (field.val && !isValidText(field.val)) {
                showAlert("warning", "Formato inválido", `El campo '${field.label}' contiene caracteres no permitidos (números o símbolos como . , - /).`);
                return;
            }
        }

        // 3. VALIDACIÓN: ALFANUMÉRICO (Sin símbolos)
        const alphaNumericFields = [
            { val: String(data.get("calle") ?? ""), label: "Calle" },
            { val: String(data.get("numDoc") ?? ""), label: "Número Doc." }
        ];

        for (const field of alphaNumericFields) {
            if (field.val && !isValidAlphaNumeric(field.val)) {
                showAlert("warning", "Formato inválido", `El campo '${field.label}' no debe contener símbolos (como puntos o guiones).`);
                return;
            }
        }

        // 4. Validaciones Numéricas
        if (!cpVal || Number(cpVal) <= 0) {
            showAlert("warning", "Datos incompletos", "El código postal debe ser un número positivo.");
            return;
        }
        if (!numVal || Number(numVal) <= 0) {
            showAlert("warning", "Datos incompletos", "El número de calle debe ser positivo.");
            return;
        }

        // 5. Validación de Negocio: CUIT
        if (posicionIva === "Responsable Inscripto" && (!cuit || cuit === "")) {
            showAlert("warning", "Datos incompletos", "Si la posición IVA es 'Responsable Inscripto', el CUIT es obligatorio.");
            return;
        }

        // 6. Construcción del Payload
        const payload: AltaHuespedRequestDTO = {
            huesped: {
                idHuesped: null,
                nombre: String(data.get("nombre") ?? ""),
                apellido: String(data.get("apellido") ?? ""),
                tipoDoc: {
                    tipoDocumento: String(data.get("tipoDocumento") ?? ""),
                },
                numDoc: String(data.get("numDoc") ?? ""),
                posicionIva: posicionIva,
                cuit: cuit === "" ? null : cuit, 
                fechaNac: String(data.get("fechaNacimiento") ?? ""),
                telefono: String(data.get("telefono") ?? ""),
                email: String(data.get("email") ?? ""),
                ocupacion: String(data.get("ocupacion") ?? ""),
                nacionalidad: String(data.get("nacionalidad") ?? ""),
                direccion: {
                    calle: String(data.get("calle") ?? ""),
                    numero: String(numVal), 
                    departamento: String(data.get("departamento") ?? ""),
                    piso: data.get("piso") ? Number(data.get("piso")) : null,
                    cp: String(cpVal),
                    localidad: String(data.get("localidad") ?? ""),
                    provincia: String(data.get("provincia") ?? ""),
                    pais: String(data.get("pais") ?? ""),
                    id: null,
                },
                idsEstadias: [],
                eliminado: false,
            },
            aceptarIgualmente: false 
        };

        sendPayload(payload, form);
    };

    const handleAceptarIgualmente = () => {
        if (pendingPayload) {
            const confirmedPayload = { ...pendingPayload, aceptarIgualmente: true };
            const form = document.getElementById("formAltaHuesped") as HTMLFormElement;
            sendPayload(confirmedPayload, form);
        }
    };

    const handleCorregir = () => {
        setDuplicateModalOpen(false);
        setPendingPayload(null);
        const inputDoc = document.querySelector('input[name="numDoc"]') as HTMLInputElement;
        if (inputDoc) inputDoc.focus();
    };

    const handleFinalizar = () => {
        setShowSuccessModal(false);
        if (createdGuest && onGuestCreated) {
            onGuestCreated(createdGuest);
        }
    };

    const handleCargarOtro = () => {
        setShowSuccessModal(false);
        setCreatedGuest(null);
    };

    const handleCancelar = () => {
        if(confirm("¿Desea cancelar el alta del huésped? Se perderán los datos.")) {
            const form = document.getElementById("formAltaHuesped") as HTMLFormElement | null;
            if (form) form.reset();
        }
    };

    return (
        <>
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Formulario de Alta</h2>
                <p className="text-sm text-gray-600">Ingrese los datos personales del nuevo huésped</p>
            </div>

            <form id="formAltaHuesped" onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {/* 1. DATOS PERSONALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Apellido *</label>
                        <Input name="apellido" placeholder="Ingrese apellido" required className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nombre *</label>
                        <Input name="nombre" placeholder="Ingrese nombre" required className="bg-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tipo Doc. *</label>
                        <select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required>
                            <option value="DNI">DNI</option>
                            <option value="PASAPORTE">PASAPORTE</option>
                            <option value="LC">LC</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Número Doc. *</label>
                        <Input name="numDoc" placeholder="Ingrese número" required className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">CUIT</label>
                        <Input name="cuit" placeholder="XX-XXXXXXXX-X" className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Fecha Nac. *</label>
                        <Input name="fechaNacimiento" type="date" required className="bg-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Posición IVA *</label>
                        <select name="posicionIva" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" required>
                            <option>Consumidor Final</option>
                            <option>Responsable Inscripto</option>
                            <option>Monotributista</option>
                            <option>Exento</option>
                        </select>
                    </div>
                </div>

                {/* 2. DIRECCIÓN */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Calle *</label>
                            <Input name="calle" required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Número *</label>
                            <Input name="numero" type="number" min={1} required className="bg-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Depto</label><Input name="departamento" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Piso</label><Input name="piso" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">CP *</label><Input name="cp" type="number" min={1} required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Localidad *</label><Input name="localidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Provincia *</label><Input name="provincia" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">País *</label><Input name="pais" required className="bg-white" /></div>
                    </div>
                </div>

                {/* 3. OTROS DATOS */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Teléfono *</label><Input name="telefono" required className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Email</label><Input name="email" type="email" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Nacionalidad *</label><Input name="nacionalidad" required className="bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Ocupación *</label><Input name="ocupacion" required className="bg-white" /></div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6">
                    <Button type="button" variant="outline" onClick={handleCancelar} className="text-rose-900 border-rose-200 hover:bg-rose-50">
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white min-w-[120px]">
                        Guardar Huésped
                    </Button>
                </div>
            </form>

            {/* MODAL ESTÁNDAR DE ERROR */}
            <ModalAlert open={modalOpen} title={modalTitle} message={modalMessage} type={modalType} onOk={() => setModalOpen(false)} okText="Aceptar" />

            {/* MODAL DUPLICADO */}
            {duplicateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-l-4 border-amber-500">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-full text-amber-600"><AlertCircle className="h-6 w-6" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">¡CUIDADO! Huésped Existente</h3>
                                <p className="text-sm text-gray-600">El tipo y número de documento ya existen en el sistema.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={handleCorregir} className="border-gray-300 text-gray-700 hover:bg-gray-50">Corregir</Button>
                            <Button onClick={handleAceptarIgualmente} className="bg-amber-600 hover:bg-amber-700 text-white">Aceptar Igualmente</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ÉXITO */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all border border-green-100">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">¡Huésped Guardado!</h3>
                                <p className="text-gray-500">
                                    El huésped <span className="font-semibold text-gray-700">{createdGuest?.apellido}, {createdGuest?.nombre}</span> ha sido registrado correctamente.
                                </p>
                                <p className="text-sm text-rose-600 font-medium pt-2">¿Desea cargar otro huésped ahora?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                <Button variant="outline" onClick={handleFinalizar} className="h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium">No, Finalizar</Button>
                                <Button onClick={handleCargarOtro} className="h-12 bg-rose-900 hover:bg-rose-800 text-white font-medium shadow-lg shadow-rose-900/20">Sí, Cargar Otro</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// --- FORMULARIO DE BUSQUEDA (CU02) ---

interface BuscarHuespedFormProps {
    onSelect?: (huesped: HuespedDTO) => void;
    onRequestAlta: () => void;
}

function BuscarHuespedForm({ onSelect, onRequestAlta }: BuscarHuespedFormProps) {
    const api = new HuespedApi();
    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [searching, setSearching] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<HuespedDTO | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        setSelectedGuest(null);
        
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);
        const tipoDocValue = String(data.get("tipoDocumento") ?? "");

        const payload: BuscarHuespedRequestDTO = {
            huesped: {
                nombre: String(data.get("nombre") ?? "") || null,
                apellido: String(data.get("apellido") ?? "") || null,
                tipoDocumento: tipoDocValue ? { tipoDocumento: tipoDocValue } : null,
                numDoc: String(data.get("numDoc") ?? "") || null,
            },
        };

        try {
            const res = await api.buscar(payload);
            if (res.resultado.id === 0) {
                setResultados(res.huespedesEncontrados);
                setMensaje(res.huespedesEncontrados.length === 0 ? "No existen coincidencias." : "");
            } else {
                setResultados([]);
                setMensaje(res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            setResultados([]);
            setMensaje("Error interno al buscar huéspedes");
        } finally {
            setSearching(false);
        }
    };

    const handleSiguiente = () => {
        if (selectedGuest) {
            if (onSelect) onSelect(selectedGuest);
        } else {
            onRequestAlta();
        }
    };

    const handleCardClick = (h: HuespedDTO) => {
        if (selectedGuest?.idHuesped === h.idHuesped) setSelectedGuest(null);
        else setSelectedGuest(h);
    };

    return (
        <div className="flex flex-col h-full relative pb-20">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Filtre por nombre, apellido o documento para continuar</p>
            </div>

            <div className="p-6 space-y-6">
                <form onSubmit={handleSearch} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Nombre</label><Input name="nombre" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Apellido</label><Input name="apellido" className="bg-white" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-gray-600">Tipo Doc.</label>
                            <select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                <option value="">Todos</option><option value="DNI">DNI</option><option value="PASAPORTE">PASAPORTE</option><option value="LC">LC</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="space-y-1.5 w-full"><label className="text-xs font-medium text-gray-600">Número</label><Input name="numDoc" className="bg-white" /></div>
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white mb-0.5" disabled={searching}>{searching ? "..." : <SearchIcon className="h-4 w-4" />}</Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-2 flex justify-between items-center">
                        <span>Resultados</span>
                        <span className="text-xs text-rose-500 font-normal bg-rose-50 px-2 py-1 rounded-full">{resultados.length} encontrados</span>
                    </h3>
                    
                    {resultados.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {resultados.map((h, i) => {
                                const isSelected = selectedGuest?.idHuesped === h.idHuesped;
                                return (
                                    <div key={i} onClick={() => handleCardClick(h)} className={`p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center cursor-pointer transition-all duration-200 ${isSelected ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/50" : "border-rose-100 hover:border-rose-300 hover:bg-gray-50"}`}>
                                        <div className="flex gap-3 items-center">
                                            <div className={`p-2 rounded-full transition-colors ${isSelected ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-800"}`}>{isSelected ? <CheckCircle2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}</div>
                                            <div>
                                                <div className="font-semibold text-rose-950 text-base">{h.apellido}, {h.nombre}</div>
                                                <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-0.5">
                                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{h.tipoDocumento?.tipoDocumento}: {h.numDoc}</span>
                                                    {h.email && <span className="text-gray-400">• {h.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="font-medium">{mensaje || "Ingrese filtros para buscar huéspedes"}</p>
                            {mensaje === "No existen coincidencias." && <Button variant="link" onClick={onRequestAlta} className="text-rose-600 font-semibold mt-2">Ir a Dar de Alta Huésped</Button>}
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-rose-100 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    {selectedGuest ? (
                        <><span className="italic text-rose-700 font-medium">Seleccionado: {selectedGuest.apellido}, {selectedGuest.nombre}</span><button onClick={() => setSelectedGuest(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors" title="Descartar selección"><X className="h-4 w-4" /></button></>
                    ) : (<span className="italic">Ningún huésped seleccionado (Se irá a Alta)</span>)}
                </div>
                <Button onClick={handleSiguiente} className="bg-rose-900 hover:bg-rose-800 text-white shadow-md min-w-[140px]">Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}