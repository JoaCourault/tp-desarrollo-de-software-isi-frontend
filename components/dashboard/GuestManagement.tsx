"use client";

import { useState } from "react";

import {

    UserPlus,

    Users,

    Search as SearchIcon,

} from "lucide-react";


import { HuespedApi } from "@/src/api/huesped.api";

import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";

import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";


// --- COMPONENTES UI ---

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import ModalAlert from "@/components/modalAlert/modalAlert";



// COMPONENTE PRINCIPAL


export function GuestManagement() {

    const [activeTab, setActiveTab] = useState<"alta" | "buscar">("alta");



    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* SUB-NAVEGACIÓN */}
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

            {/* CONTENIDO */}
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                {activeTab === "alta" ? <AltaHuespedForm /> : <BuscarHuespedForm />}
            </div>
        </div>
    );
}

// FORMULARIO DE ALTA

function AltaHuespedForm() {
    const api = new HuespedApi();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);

        const cpVal = data.get("cp");
        const numVal = data.get("numero");

        if (!cpVal || Number(cpVal) <= 0) {
            showAlert("warning", "Datos incompletos", "El código postal debe ser un número positivo.");
            return;
        }
        if (!numVal || Number(numVal) <= 0) {
            showAlert("warning", "Datos incompletos", "El número de calle debe ser positivo.");
            return;
        }

        const payload: AltaHuespedRequestDTO = {
            huesped: {
                idHuesped: null,
                nombre: String(data.get("nombre") ?? ""),
                apellido: String(data.get("apellido") ?? ""),
                tipoDocumento: {
                    tipoDocumento: String(data.get("tipoDocumento") ?? ""),
                },
                numDoc: String(data.get("numDoc") ?? ""),
                posicionIva: String(data.get("posicionIva") ?? ""),
                cuit: String(data.get("cuit") ?? "") || null,
                fechaNacimiento: String(data.get("fechaNacimiento") ?? ""),
                telefono: String(data.get("telefono") ?? ""),
                email: String(data.get("email") ?? ""),
                ocupacion: String(data.get("ocupacion") ?? ""),
                nacionalidad: String(data.get("nacionalidad") ?? ""),
                direccion: {
                    calle: String(data.get("calle") ?? ""),
                    numero: String(numVal), // Enviamos el número capturado
                    departamento: String(data.get("departamento") ?? ""),
                    piso: String(data.get("piso") ?? ""),
                    codigoPostal: String(cpVal),
                    localidad: String(data.get("localidad") ?? ""),
                    provincia: String(data.get("provincia") ?? ""),
                    pais: String(data.get("pais") ?? ""),
                    id: null,
                },
                idsEstadias: [],
                eliminado: false,
            },
        };

        try {
            const res = await api.alta(payload);
            if (res.resultado.id === 0) {
                showAlert("success", "Huésped creado", "El huésped fue cargado exitosamente.");
                form.reset();
            } else {
                showAlert("error", "Error al crear huésped", res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            showAlert("error", "Error inesperado", "Ocurrió un error inesperado al guardar el huésped.");
        }
    };

    const handleCancelar = () => {
        const form = document.getElementById("formAltaHuesped") as HTMLFormElement | null;
        if (form) form.reset();
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
                        <select
                            name="tipoDocumento"
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            required
                        >
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE">Libreta de Enrolamiento (LE)</option>
                            <option value="LC">Libreta Cívica (LC)</option>
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
                        <select
                            name="posicionIva"
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            required
                        >
                            <option>Consumidor Final</option>
                            <option>Responsable Inscripto</option>
                        </select>
                    </div>
                </div>

                {/* 2. DIRECCIÓN */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Dirección</h3>

                    {/* Fila 1: Calle y Número */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Calle *</label>
                            <Input name="calle" placeholder="Nombre de la calle" required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Número *</label>
                            <Input name="numero" type="number" min={1} placeholder="123" required className="bg-white" />
                        </div>
                    </div>

                    {/* Fila 2: Depto, Piso, CP, Localidad */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Depto</label>
                            <Input name="departamento" placeholder="-" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Piso</label>
                            <Input name="piso" placeholder="-" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">CP *</label>
                            {/* CP obligatorio y numérico */}
                            <Input name="cp" type="number" min={1} required placeholder="0000" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Localidad *</label>
                            <Input name="localidad" placeholder="Localidad" required className="bg-white" />
                        </div>
                    </div>

                    {/* Fila 3: Provincia y País */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Provincia *</label>
                            <Input name="provincia" placeholder="Provincia" required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">País *</label>
                            <Input name="pais" placeholder="País" required className="bg-white" />
                        </div>
                    </div>
                </div>

                {/* 3. OTROS DATOS */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-1">Otros Datos</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                            <Input name="telefono" placeholder="+54 11 ..." required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input name="email" type="email" placeholder="ejemplo@mail.com" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Nacionalidad *</label>
                            <Input name="nacionalidad" placeholder="Nacionalidad" required className="bg-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Ocupación *</label>
                            <Input name="ocupacion" placeholder="Ocupación" required className="bg-white" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 mt-6">
                    <Button type="button" variant="outline" onClick={handleCancelar} className="text-rose-900 border-rose-200 hover:bg-rose-50">
                        Limpiar
                    </Button>
                    <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white min-w-[120px]">
                        Guardar Huésped
                    </Button>
                </div>
            </form>

            <ModalAlert
                open={modalOpen}
                title={modalTitle}
                message={modalMessage}
                type={modalType}
                onOk={() => setModalOpen(false)}
                okText="Aceptar"
            />
        </>
    );
}

// FORMULARIO DE BUSQUEDA

function BuscarHuespedForm() {
    const api = new HuespedApi();
    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
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
                setMensaje(res.huespedesEncontrados.length === 0 ? "No se encontraron resultados." : "");
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

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-rose-100 px-6 py-4 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-rose-950">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Filtre por nombre, apellido o documento</p>
            </div>

            <div className="p-6 space-y-6">
                <form onSubmit={handleSearch} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Nombre</label>
                            <Input name="nombre" placeholder="Ej: Juan" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Apellido</label>
                            <Input name="apellido" placeholder="Ej: Perez" className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Tipo Doc.</label>
                            <select name="tipoDocumento" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" defaultValue="">
                                <option value="">Todos</option>
                                <option value="DNI">DNI</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="LE / LC">LE / LC</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="space-y-1.5 w-full">
                                <label className="text-xs font-medium text-gray-600">Número</label>
                                <Input name="numDoc" placeholder="123..." className="bg-white" />
                            </div>
                            <Button type="submit" className="bg-rose-900 hover:bg-rose-800 text-white mb-0.5" disabled={searching}>
                                {searching ? "..." : <SearchIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-rose-950 border-b border-rose-100 pb-2">Resultados ({resultados.length})</h3>
                    {resultados.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {resultados.map((h, i) => (
                                <div key={i} className="p-4 border border-rose-100 rounded-lg bg-white shadow-sm flex justify-between items-center group">
                                    <div>
                                        <div className="font-medium text-rose-950">{h.apellido}, {h.nombre}</div>
                                        <div className="text-sm text-gray-500 flex gap-2 mt-1">
                                            <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-xs border border-rose-100">
                                                {h.tipoDocumento?.tipoDocumento}: {h.numDoc}
                                            </span>
                                            {h.email && <span>• {h.email}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            {mensaje || "Ingrese filtros para buscar huéspedes"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}