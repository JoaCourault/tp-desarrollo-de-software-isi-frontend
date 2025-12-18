"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Hotel, LogOut, Users, Bed, CheckCircle, XCircle, CreditCard } from "lucide-react";

// Componentes existentes
import { GuestManagement } from "@/components/dashboard/Huesped/GuestManagement";
import { RoomManagement } from "@/components/dashboard/RoomManagement";
import CheckInPanel from "@/components/dashboard/CheckInPanel";
import { CheckOutPanel } from "@/components/dashboard/CheckOutPanel";
import CancelReservationPanel from "@/components/dashboard/CancelReservationPanel";

export default function DashboardPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"guests" | "rooms" | "checkin" | "cancelar" | "checkout">("guests");
    const [isChecking, setIsChecking] = useState(true);

    // Validar login
    useEffect(() => {
        const usuario = localStorage.getItem("usuarioLogueado");
        if (!usuario) {
            router.push("/");
        } else {
            // setTimeout para evitar el warning de setState en useEffect
            const timer = setTimeout(() => {
                setIsChecking(false);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("usuarioLogueado");
        router.push("/");
    };

    if (isChecking) return null;

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* HEADER */}
            <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-900 rounded-lg flex items-center justify-center shadow-sm">
                                <Hotel className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-rose-950">Flower Hotel</h1>
                                <p className="text-xs text-muted-foreground">Acceso Root</p>
                            </div>
                        </div>

                        {/* Logout */}
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="bg-rose-900 text-green hover:bg-rose-700"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </header>

            {/* TABS DE NAVEGACIÓN */}
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 lg:px-6">
                    <nav className="flex gap-2 py-2 overflow-x-auto">

                        {/* TAB Huéspedes */}
                        <Button
                            variant={activeTab === "guests" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("guests")}
                            className={`gap-2 whitespace-nowrap ${activeTab === "guests"
                                ? "bg-rose-100 text-rose-900 hover:bg-rose-200"
                                : "text-muted-foreground hover:text-rose-900 hover:bg-rose-50"
                            }`}
                        >
                            <Users className="w-4 h-4" /> Gestión de Huéspedes
                        </Button>

                        {/* TAB Habitaciones */}
                        <Button
                            variant={activeTab === "rooms" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("rooms")}
                            className={`gap-2 whitespace-nowrap ${activeTab === "rooms"
                                ? "bg-rose-100 text-rose-900 hover:bg-rose-200"
                                : "text-muted-foreground hover:text-rose-900 hover:bg-rose-50"
                            }`}
                        >
                            <Bed className="w-4 h-4" /> Reservar
                        </Button>

                        {/* TAB Check-In */}
                        <Button
                            variant={activeTab === "checkin" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("checkin")}
                            className={`gap-2 whitespace-nowrap ${activeTab === "checkin"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "text-muted-foreground hover:text-green-700 hover:bg-green-50"
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" /> Check-In
                        </Button>

                        {/* TAB: CHECK-OUT / FACTURACIÓN */}
                        <Button
                            variant={activeTab === "checkout" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("checkout")}
                            className={`gap-2 whitespace-nowrap ${activeTab === "checkout"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "text-muted-foreground hover:text-blue-700 hover:bg-blue-50"
                            }`}
                        >
                            <CreditCard className="w-4 h-4" /> Check-Out
                        </Button>

                        {/* TAB Cancelar Reserva */}
                        <Button
                            variant={activeTab === "cancelar" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("cancelar")}
                            className={`gap-2 whitespace-nowrap ${activeTab === "cancelar"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "text-muted-foreground hover:text-red-700 hover:bg-red-50"
                            }`}
                        >
                            <XCircle className="w-4 h-4" /> Cancelar Reserva
                        </Button>

                    </nav>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <main className="container mx-auto px-4 lg:px-6 py-8">
                {activeTab === "guests" && <GuestManagement />}
                {activeTab === "rooms" && <RoomManagement />}
                {activeTab === "checkin" && <CheckInPanel />}
                {activeTab === "cancelar" && <CancelReservationPanel />}
                {activeTab === "checkout" && <CheckOutPanel />}
            </main>
        </div>
    );
}