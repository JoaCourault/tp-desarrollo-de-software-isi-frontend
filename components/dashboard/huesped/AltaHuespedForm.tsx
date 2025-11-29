"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalAlert from "@/components/modalAlert/modalAlert";

import { HuespedApi } from "@/src/api/huesped.api";
import { AltaHuespedRequestDTO } from "@/src/dto/Huesped/AltaHuespedRequest.dto";

export default function AltaHuesped() {
    const api = new HuespedApi();

    // MODAL STATES
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
                    cp: String(data.get("cp") ?? 0),
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
        <>
            {/* HEADER */}
            <div className="border-b border-rose-200 px-6 py-4 bg-rose-50/40 rounded-t-xl">
                <h2 className="text-lg font-semibold text-rose-900">Dar Alta Huésped</h2>
                <p className="text-sm text-gray-600">
                    Ingrese los datos personales del nuevo huésped
                </p>
            </div>

            <form
                id="formAltaHuesped"
                onSubmit={handleSubmit}
                className="px-6 py-6 space-y-6 border border-rose-200 bg-white rounded-b-xl"
            >

                {/* FILA: APELLIDO - NOMBRE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Apellido *
                        </label>
                        <Input
                            name="apellido"
                            placeholder="Ingrese apellido"
                            required
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Nombre *
                        </label>
                        <Input
                            name="nombre"
                            placeholder="Ingrese nombre"
                            required
                            className="bg-white"
                        />
                    </div>
                </div>

                {/* FILA: DOC, NRO DOC, CUIT, FECHA */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Tipo de Documento *
                        </label>
                        <select
                            name="tipoDocumento"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE">LE</option>
                            <option value="LC">LC</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Número de Documento *
                        </label>
                        <Input
                            name="numDoc"
                            placeholder="Ej: 12345678"
                            required
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">CUIT</label>
                        <Input
                            name="cuit"
                            placeholder="XX-XXXXXXXX-X"
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Fecha de Nacimiento *
                        </label>
                        <Input
                            type="date"
                            name="fechaNacimiento"
                            required
                            className="bg-white"
                        />
                    </div>
                </div>

                {/* IVA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Posición frente al IVA *
                        </label>
                        <select
                            name="posicionIva"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                            <option>Consumidor Final</option>
                            <option>Responsable Inscripto</option>
                        </select>
                    </div>
                </div>

                {/* DIRECCIÓN */}
                <h3 className="text-sm font-semibold text-rose-900 border-b border-rose-200 pb-1 mt-4">
                    Dirección
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Calle *</label>
                        <Input
                            name="calle"
                            required
                            placeholder="Ej: Salta"
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Número *</label>
                        <Input
                            name="numero"
                            required
                            placeholder="Ej: 1234"
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input name="departamento" placeholder="Depto" className="bg-white" />
                    <Input name="piso" placeholder="Piso" className="bg-white" />
                    <Input
                        name="cp"
                        placeholder="Código Postal"
                        required
                        className="bg-white"
                    />
                    <Input
                        name="localidad"
                        placeholder="Localidad *"
                        required
                        className="bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="provincia"
                        placeholder="Provincia *"
                        required
                        className="bg-white"
                    />
                    <Input
                        name="pais"
                        placeholder="País *"
                        required
                        className="bg-white"
                    />
                </div>

                {/* OTROS DATOS */}
                <h3 className="text-sm font-semibold text-rose-900 border-b border-rose-200 pb-1 mt-4">
                    Otros Datos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        name="telefono"
                        placeholder="Teléfono *"
                        required
                        className="bg-white"
                    />
                    <Input name="email" placeholder="Email" className="bg-white" />
                    <Input
                        name="nacionalidad"
                        placeholder="Nacionalidad *"
                        required
                        className="bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="ocupacion"
                        placeholder="Ocupación *"
                        required
                        className="bg-white"
                    />
                </div>

                {/* BOTONES */}
                <div className="flex justify-end gap-3 pt-6 border-t border-rose-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelar}
                        className="text-rose-900 border-rose-300 hover:bg-rose-100"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        className="bg-rose-900 hover:bg-rose-800 text-white min-w-[120px]"
                    >
                        Siguiente
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
