"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Hotel, LogOut, Users, Bed } from "lucide-react";

// Importamos los componentes que creamos
import { GuestManagement } from "@/components/dashboard/GuestManagement";
import { RoomManagement } from "@/components/dashboard/RoomManagement";

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"guests" | "rooms">("guests");
    const [isChecking, setIsChecking] = useState(true);

    // 1. PROTECCIÓN DE RUTA: Si no hay login, echar al usuario
    useEffect(() => {
        const usuario = localStorage.getItem("usuarioLogueado");
        if (!usuario) {
            router.push("/"); // CORREGIDO: Redirige a la raíz (Login)
        } else {
            setIsChecking(false); // Ya validamos, mostrar dashboard
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("usuarioLogueado");
        router.push("/"); // CORREGIDO: Redirige a la raíz (Login)
    };

    // Mientras verificamos si está logueado, no mostrar nada (evita parpadeos)
    if (isChecking) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* HEADER */}
            <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-900 rounded-lg flex items-center justify-center shadow-sm">
                                <Hotel className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-rose-950 leading-tight">Flower Hotel</h1>
                                <p className="text-xs text-muted-foreground font-medium">Acceso Root</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="text-rose-900 border-rose-200 hover:bg-rose-50">
                            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 lg:px-6">
                    <nav className="flex gap-2 py-2">
                        <Button
                            variant={activeTab === "guests" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("guests")}
                            className={`gap-2 ${activeTab === "guests" ? "bg-rose-100 text-rose-900 hover:bg-rose-200" : "text-muted-foreground hover:text-rose-900 hover:bg-rose-50"}`}
                        >
                            <Users className="w-4 h-4" /> Gestión de Huéspedes
                        </Button>
                        <Button
                            variant={activeTab === "rooms" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("rooms")}
                            className={`gap-2 ${activeTab === "rooms" ? "bg-rose-100 text-rose-900 hover:bg-rose-200" : "text-muted-foreground hover:text-rose-900 hover:bg-rose-50"}`}
                        >
                            <Bed className="w-4 h-4" /> Gestión de Habitaciones
                        </Button>
                    </nav>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <main className="container mx-auto px-4 lg:px-6 py-8">
                {activeTab === "guests" ? <GuestManagement /> : <RoomManagement />}
            </main>
        </div>
    );
}