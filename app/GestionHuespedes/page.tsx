"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalAlert from "@/components/modalAlert/modalAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";
import {
    Users,
    UserPlus,
    Search as SearchIcon,
    Building2,
    LogOut,
} from "lucide-react";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";
import { HuespedApi } from "@/src/api/huesped.api";
import {
    AltaHuespedRequestDTO,
} from "@/src/dto/Huesped/AltaHuespedRequest.dto";

type Tab = "alta" | "buscar";

export default function GestionHuespedesPage() {
    const [activeTab, setActiveTab] = useState<Tab>("alta");
    const router = useRouter();

    return (
        <div className="min-h-screen bg-rose-50 flex flex-col">
            {/* NAVBAR SUPERIOR */}
            <header className="w-full border-b bg-white">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-800 text-white p-2 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div className="leading-tight">
                            <div className="font-semibold text-sm sm:text-base">
                                Flower Hotel
                            </div>
                            <div className="text-xs text-gray-500">Acceso Root</div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="border-rose-200 text-rose-900 hover:bg-rose-100 flex items-center gap-2"
                        onClick={() => {
                            localStorage.removeItem("usuarioLogueado");
                            router.push("/Usuario/Login");
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>

                {/* TABS PRINCIPALES */}
                <div className="border-t bg-rose-50/60">
                    <div className="max-w-6xl mx-auto flex gap-2 px-4 py-2">
                        <Button className="bg-rose-900 hover:bg-rose-800 text-white text-sm">
                            Gestión de Huéspedes
                        </Button>

                        <Button
                            variant="ghost"
                            className="text-rose-900 hover:bg-rose-100 text-sm"
                        >
                            Gestión de Habitaciones
                        </Button>
                    </div>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                    {/* TÍTULO */}
                    <section>
                        <h1 className="text-2xl font-semibold text-rose-950">
                            Gestión de Huéspedes
                        </h1>
                        <p className="text-sm text-gray-600">
                            Administrar huéspedes del hotel
                        </p>
                    </section>

                    {/* BOTONES ALTA / BUSCAR */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab("alta")}
                            className={`flex flex-col items-center justify-center border rounded-lg py-6 px-4 text-sm sm:text-base transition ${
                                activeTab === "alta"
                                    ? "bg-rose-900 text-white border-rose-900 shadow-md"
                                    : "bg-white text-rose-900 hover:bg-rose-50 border-rose-100"
                            }`}
                        >
                            <UserPlus className="h-5 w-5 mb-2" />
                            <span>Dar Alta Huésped</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("buscar")}
                            className={`flex flex-col items-center justify-center border rounded-lg py-6 px-4 text-sm sm:text-base transition ${
                                activeTab === "buscar"
                                    ? "bg-rose-900 text-white border-rose-900 shadow-md"
                                    : "bg-white text-rose-900 hover:bg-rose-50 border-rose-100"
                            }`}
                        >
                            <Users className="h-5 w-5 mb-2" />
                            <span>Buscar Huésped</span>
                        </button>
                    </section>

                    {/* CONTENIDO SEGÚN TAB */}
                    {activeTab === "alta" ? <AltaHuesped /> : <BuscarHuesped />}
                </div>
            </main>
        </div>
    );
}

/* ============================================================
   CU09 – DAR ALTA HUÉSPED
============================================================ */

function AltaHuesped() {
    const api = new HuespedApi();
    const router = useRouter();

    // Estados del modal
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
                    numero: String(data.get("numero") ?? ""),
                    departamento: String(data.get("departamento") ?? ""),
                    piso: String(data.get("piso") ?? ""),
                    codigoPostal: Number(data.get("cp") ?? 0),
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
            showAlert(
                "error",
                "Error inesperado",
                "Ocurrió un error inesperado al guardar el huésped."
            );
        }
    };

    const handleCancelar = () => {
        const form = document.getElementById("formAltaHuesped") as HTMLFormElement | null;
        if (form) form.reset();
    };

    return (
        <Card className="border-rose-100 shadow-sm">
            <div className="border-b border-rose-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-rose-950">
                    Dar Alta Huésped
                </h2>
                <p className="text-sm text-gray-600">
                    Ingrese los datos personales del nuevo huésped
                </p>
            </div>

            <form
                id="formAltaHuesped"
                onSubmit={handleSubmit}
                className="px-6 py-5 space-y-6"
            >
                {/* Apellido / Nombre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Apellido *
                        </label>
                        <Input name="apellido" placeholder="Ingrese apellido" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Nombre *
                        </label>
                        <Input name="nombre" placeholder="Ingrese nombre" required />
                    </div>
                </div>

                {/* Documento / CUIT / Fecha */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Tipo de Documento *
                        </label>
                        <select
                            name="tipoDocumento"
                            className="h-10 w-full rounded-md border border-rose-200 bg-white px-3 text-sm"
                            required
                        >
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE / LC">LE / LC</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Número de Documento *
                        </label>
                        <Input name="numDoc" placeholder="Ingrese número" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            CUIT
                        </label>
                        <Input name="cuit" placeholder="XX-XXXXXXXX-X" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Fecha de Nacimiento *
                        </label>
                        <Input name="fechaNacimiento" type="date" required />
                    </div>
                </div>

                {/* IVA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Posición frente al IVA *
                        </label>
                        <select
                            name="posicionIva"
                            className="h-10 w-full rounded-md border border-rose-200 bg-white px-3 text-sm"
                            required
                        >
                            <option>Consumidor Final</option>
                            <option>Responsable Inscripto</option>
                        </select>
                    </div>
                </div>

                {/* DIRECCIÓN */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-rose-950">Dirección</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Calle *
                            </label>
                            <Input name="calle" placeholder="Ingrese calle" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Número *
                            </label>
                            <Input name="numero" placeholder="Ingrese número" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Departamento
                            </label>
                            <Input name="departamento" placeholder="Depto" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Piso
                            </label>
                            <Input name="piso" placeholder="Piso" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Código Postal *
                            </label>
                            <Input name="cp" type="number" min={1} required placeholder="CP" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Localidad *
                            </label>
                            <Input name="localidad" placeholder="Localidad" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                Provincia *
                            </label>
                            <Input name="provincia" placeholder="Provincia" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-rose-950 mb-1">
                                País *
                            </label>
                            <Input name="pais" placeholder="País" required />
                        </div>
                    </div>
                </div>

                {/* CONTACTO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Teléfono *
                        </label>
                        <Input name="telefono" placeholder="+54 11 1234-5678" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Email
                        </label>
                        <Input name="email" placeholder="ejemplo@mail.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Nacionalidad *
                        </label>
                        <Input name="nacionalidad" placeholder="Nacionalidad" required />
                    </div>
                </div>

                {/* Ocupación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rose-950 mb-1">
                            Ocupación *
                        </label>
                        <Input name="ocupacion" placeholder="Ocupación" required />
                    </div>
                </div>

                {/* BOTONES */}
                <div className="flex justify-end gap-3 pt-4 border-t border-rose-100 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelar}
                        className="border-rose-200 text-rose-900 hover:bg-rose-100"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        className="bg-rose-900 hover:bg-rose-800 text-white"
                    >
                        Siguiente
                    </Button>
                </div>
            </form>

            {/* MODAL ALERT */}
            <ModalAlert
                open={modalOpen}
                title={modalTitle}
                message={modalMessage}
                type={modalType}
                onOk={() => {
                    if (modalType === "success") {
                        window.location.reload();
                    }
                    setModalOpen(false);
                }}
                okText="Aceptar"
            />
        </Card>
    );
}

/* ============================================================
   CU02 – BUSCAR HUÉSPED
============================================================ */

function BuscarHuesped() {
    const api = new HuespedApi();
    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);

        const tipoDocValue = String(data.get("tipoDocumento") ?? "");

        const payload: BuscarHuespedRequestDTO = {
            huesped: {
                nombre: String(data.get("nombre") ?? "") || null,
                apellido: String(data.get("apellido") ?? "") || null,
                tipoDocumento: tipoDocValue
                    ? { tipoDocumento: tipoDocValue }
                    : null,
                numDoc: String(data.get("numDoc") ?? "") || null,
            },
        };

        try {
            const res = await api.buscar(payload);

            if (res.resultado.id === 0) {
                setResultados(res.huespedesEncontrados);
                setMensaje("");
            } else {
                setResultados([]);
                setMensaje(res.resultado.mensaje);
            }
        } catch (err) {
            console.error(err);
            setResultados([]);
            setMensaje("Error interno al buscar huéspedes");
        }
    };

    return (
        <div className="space-y-5">
            {/* Filtros */}
            <Card className="border-rose-100 shadow-sm">
                <div className="border-b border-rose-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-rose-950">
                        Buscar Huésped
                    </h2>
                    <p className="text-sm text-gray-600">
                        Complete los campos para buscar huéspedes
                    </p>
                </div>

                <form onSubmit={handleSearch} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input name="nombre" placeholder="Nombre..." />
                        <Input name="apellido" placeholder="Apellido..." />
                        <select
                            name="tipoDocumento"
                            className="h-10 w-full rounded-md border border-rose-200 px-3 text-sm"
                            defaultValue=""
                        >
                            <option value="">Tipo documento (opcional)</option>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE / LC">LE / LC</option>
                        </select>

                        <div className="flex gap-2 items-end">
                            <Input name="numDoc" placeholder="Número..." />
                            <Button
                                type="submit"
                                className="bg-rose-900 hover:bg-rose-800 text-white flex items-center gap-2"
                            >
                                <SearchIcon className="h-4 w-4" />
                                Buscar
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Resultados */}
            <Card className="border-rose-100 shadow-sm">
                <div className="border-b border-rose-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-rose-950">
                        Resultados ({resultados.length})
                    </h2>
                </div>

                <div className="px-6 py-6">
                    {resultados.length > 0 ? (
                        <ul className="space-y-2">
                            {resultados.map((h, i) => (
                                <li
                                    key={i}
                                    className="p-3 border rounded-md bg-white shadow-sm text-sm"
                                >
                                    <strong>{h.apellido}, {h.nombre}</strong> — {h.tipoDocumento?.tipoDocumento} {h.numDoc}
                                    <br />
                                    <span className="text-gray-600">{h.email || "Sin email"}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">{mensaje || "No hay resultados"}</p>
                    )}
                </div>
            </Card>
        </div>
    );
}
