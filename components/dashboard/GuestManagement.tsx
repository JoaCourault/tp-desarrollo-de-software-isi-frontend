"use client";

import { useState } from "react";
import { HuespedDTO } from "@/src/dto/Huesped/Huesped.dto";

// Ajusta las rutas según tu estructura de carpetas
import { BuscarHuespedForm } from "@/components/huespedes/BuscarHuesped";
import { HuespedForm } from "@/components/huespedes/HuespedForm";
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

export function GuestManagement() {
    // view controla qué componente se ve
    const [view, setView] = useState<"buscar" | "alta" | "modificar">("buscar");
    const [selectedHuesped, setSelectedHuesped] = useState<HuespedDTO | null>(null);

    // Un simple contador para forzar la recarga del buscador si volvemos de una edición
    const [refreshKey, setRefreshKey] = useState(0);

    // Estados para el flujo de cancelación
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCancelledMessage, setShowCancelledMessage] = useState(false);

    const handleGoToCreate = () => {
        setSelectedHuesped(null);
        setView("alta");
    };

    const handleGoToEdit = (huesped: HuespedDTO) => {
        setSelectedHuesped(huesped);
        setView("modificar");
    };

    // Vuelve al buscador (se usa al guardar exitosamente o al finalizar cancelación)
    const handleBack = (shouldRefresh: boolean) => {
        setSelectedHuesped(null);
        setView("buscar");
        if (shouldRefresh) {
            setRefreshKey(prev => prev + 1);
        }
    };

    // --- LÓGICA DE CANCELACIÓN ---

    // 1. El usuario presiona "Cancelar" dentro del formulario
    const handleRequestCancel = () => {
        setShowCancelConfirm(true);
    };

    // 2. El usuario confirma "Sí, quiero cancelar" en el diálogo
    const confirmCancel = () => {
        setShowCancelConfirm(false);
        setShowCancelledMessage(true); // Muestra cartel "Operación cancelada"
    };

    // 3. El usuario decide NO cancelar (cierra el diálogo y sigue en el formulario)
    const abortCancel = () => {
        setShowCancelConfirm(false);
    };

    // 4. El usuario da "Aceptar" al cartel de "Operación cancelada" -> Vuelve al inicio
    const finalizeCancel = () => {
        setShowCancelledMessage(false);
        handleBack(false); // Vuelve a buscar sin refrescar necesariamente
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
                        onCancel={handleRequestCancel} // Pasamos la función que abre el modal
                    />
                )}
            </div>

            {/* ALERTA: ¿DESEA CANCELAR? */}
            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Desea cancelar la operación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Si cancela ahora, se perderán los datos ingresados y volverá al inicio.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={abortCancel}>No, continuar editando</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-rose-900 hover:bg-rose-800">
                            Sí, cancelar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MODAL: OPERACIÓN CANCELADA */}
            <ModalAlert
                open={showCancelledMessage}
                title="Operación Cancelada"
                message="El alta/modificación de huésped ha sido cancelada."
                type="info"
                onOk={finalizeCancel}
                okText="Aceptar"
            />
        </div>
    );
}