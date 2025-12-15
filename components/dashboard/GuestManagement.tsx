"use client";

import { useState } from "react";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

// Importamos los componentes nuevos (Ajusta las rutas si decidiste otra estructura)
import { BuscarHuespedForm } from "@/components/huespedes/BuscarHuesped";
import { HuespedForm } from "@/components/huespedes/HuespedForm";

export function GuestManagement() {
    // view controla qué componente se ve
    const [view, setView] = useState<"buscar" | "alta" | "modificar">("buscar");
    const [selectedHuesped, setSelectedHuesped] = useState<HuespedDTO | null>(null);

    // Un simple contador para forzar la recarga del buscador si volvemos de una edición
    const [refreshKey, setRefreshKey] = useState(0);

    const handleGoToCreate = () => {
        setSelectedHuesped(null);
        setView("alta");
    };

    const handleGoToEdit = (huesped: HuespedDTO) => {
        setSelectedHuesped(huesped);
        setView("modificar");
    };

    const handleBack = (shouldRefresh: boolean) => {
        setSelectedHuesped(null);
        setView("buscar");
        if (shouldRefresh) {
            setRefreshKey(prev => prev + 1);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                {view === "buscar" ? (
                    <BuscarHuespedForm
                        key={refreshKey} // Esto fuerza a que el componente se reinicie al cambiar la key
                        onGoToCreate={handleGoToCreate}
                        onGoToEdit={handleGoToEdit}
                    />
                ) : (
                    <HuespedForm
                        initialData={selectedHuesped}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    );
}