"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { HuespedApi } from "@/src/api/huesped.api";
import { BuscarHuespedRequestDTO } from "@/src/dto/Huesped/BuscarHuespedRequest.dto";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BuscarHuesped() {
    const api = new HuespedApi();
    const router = useRouter();

    const [resultados, setResultados] = useState<HuespedDTO[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [searching, setSearching] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
                setMensaje(
                    res.huespedesEncontrados.length === 0
                        ? "No se encontraron coincidencias."
                        : ""
                );
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
            router.push("/dashboard/guest/alta");
            return;
        }

        router.push(`/dashboard/guest/modificar?id=${selectedId}`);
    };

    return (
        <div className="space-y-6">

            {/* ENCABEZADO */}
            <div className="border-b border-rose-200 px-6 py-4 bg-rose-50/40 rounded-t-xl">
                <h2 className="text-lg font-semibold text-rose-900">Buscar Huésped</h2>
                <p className="text-sm text-gray-600">Complete los campos para buscar huéspedes o presione buscar para listar todos</p>
            </div>

            {/* FORMULARIO */}
            <form
                onSubmit={handleSearch}
                className="p-6 bg-white border border-rose-200 rounded-xl space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

                    {/* NOMBRE */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nombre</label>
                        <Input name="nombre" placeholder="Nombre..." className="bg-white" />
                    </div>

                    {/* APELLIDO */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Apellido</label>
                        <Input name="apellido" placeholder="Apellido..." className="bg-white" />
                    </div>

                    {/* TIPO DOC */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tipo Doc.</label>
                        <select
                            name="tipoDocumento"
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:ring-rose-400"
                        >
                            <option value="">Todos</option>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="LE">LE</option>
                            <option value="LC"> LC</option>
                        </select>
                    </div>

                    {/* NRO DOC */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Número</label>
                        <Input name="numDoc" placeholder="12345678" className="bg-white" />
                    </div>

                    {/* BOTÓN BUSCAR */}
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

                        {/* BOTÓN SIGUIENTE */}
                        <div className="flex justify-end pt-4">
                            {resultados.length > 0 && (
                                <Button
                                    onClick={handleNext}
                                    className="bg-rose-900 text-white hover:bg-rose-800 min-w-[120px]"
                                >
                                    Siguiente
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
