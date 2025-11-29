"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { HuespedApi } from "@/src/api/huesped.api";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

import { Search, X, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BuscarHuespedForm() {
    const api = new HuespedApi();
    const router = useRouter();

    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [searching, setSearching] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        setSelectedId(null);

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

                if (res.huespedesEncontrados.length === 0) {
                    setMensaje("No se encontraron coincidencias.");
                    setShowModal(true);
                } else {
                    setMensaje("");
                }
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

    const handleNext = () => {
        if (!selectedId) {
            router.push("/dashboard/huesped/alta");
            return;
        }

        router.push(`/dashboard/huesped/modificar?id=${selectedId}`);
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="border-b border-rose-200 px-6 py-4 bg-rose-50/40 rounded-t-xl">
                <h2 className="text-lg font-semibold text-rose-900">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">
                    Complete los campos para buscar huéspedes o presione buscar para listar todos
                </p>
            </div>

            {/* FORMULARIO */}
            <form
                onSubmit={handleSearch}
                className="p-6 bg-white border border-rose-200 rounded-xl space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nombre</label>
                        <Input name="nombre" placeholder="Nombre..." className="bg-white" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Apellido</label>
                        <Input name="apellido" placeholder="Apellido..." className="bg-white" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tipo Doc.</label>
                        <select
                            name="tipoDocumento"
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                        >
                            <option value="">Todos</option>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE">LE</option>
                            <option value="LC">LC</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Número</label>
                        <Input name="numDoc" placeholder="12345678" className="bg-white" />
                    </div>

                    <div className="flex">
                        <Button
                            type="submit"
                            className="bg-rose-900 text-white hover:bg-rose-800 w-full h-10"
                        >
                            {searching ? "..." : <Search className="h-4 w-4" />}
                            <span className="ml-2">Buscar</span>
                        </Button>
                    </div>

                </div>
            </form>

            {/* RESULTADOS */}
            <div className="bg-white border border-rose-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-rose-900 border-b border-rose-200 pb-2">
                    Resultados ({resultados.length})
                </h3>

                {resultados.length === 0 ? (
                    <div className="text-gray-600 text-sm py-4">{mensaje}</div>
                ) : (
                    <div className="space-y-3 mt-4">
                        {resultados.map((h) => (
                            <div
                                key={h.idHuesped}
                                onClick={() => setSelectedId(h.idHuesped!)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all
                                    ${
                                        selectedId === h.idHuesped
                                            ? "border-rose-600 bg-rose-50 shadow-sm"
                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                    }`}
                            >
                                <div className="font-medium text-rose-900">
                                    {h.apellido}, {h.nombre} — {h.tipoDocumento?.tipoDocumento} {h.numDoc}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {h.email || "Sin email"}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleNext}
                                className="bg-rose-900 text-white hover:bg-rose-800 min-w-[120px]"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ====================== MODAL CU02 ====================== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-rose-200 p-6 space-y-4">

                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-rose-900">
                                No se encontraron huéspedes
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        <p className="text-gray-700">
                            No se encontraron huéspedes con esos datos.
                            ¿Desea dar de alta uno nuevo?
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard")}
                                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                            >
                                Cancelar
                            </Button>

                            <Button
                                onClick={() => router.push("/dashboard/huesped/alta")}
                                className="bg-rose-900 text-white hover:bg-rose-800"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Dar Alta Huésped
                            </Button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
