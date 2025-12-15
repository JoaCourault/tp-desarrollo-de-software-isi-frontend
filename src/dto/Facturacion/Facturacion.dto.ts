
// --- RESPONSABLES DE PAGO (Payers) ---
export interface DireccionDTO {
    calle: string;
    numero: number;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
}

export interface PayerBase {
    idResponsable?: string;
    email: string;
    telefono: string;
    direccion: DireccionDTO;
    esPersonaJuridica: boolean;
    condicionIva: "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "CONSUMIDOR_FINAL" | "EXENTO";
}

export interface PersonaFisicaDTO extends PayerBase {
    dni: string;
    nombre: string;
    apellido: string;
    fechaNacimiento?: string;
}

export interface PersonaJuridicaDTO extends PayerBase {
    cuit: string;
    razonSocial: string;
    fechaConstitucion?: string;
}

export type PayerDTO = PersonaFisicaDTO | PersonaJuridicaDTO;

// --- FACTURACIÓN Y ESTADÍA ---

export interface ItemFacturable {
    id: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    seleccionado?: boolean; // Para el checkbox del front
}

// Datos que trae el sistema al buscar la habitación
export interface EstadiaDetalleDTO {
    idEstadia: string;
    nroHabitacion: number;
    ocupantes: PayerDTO[]; // Lista de ocupantes actuales para selección rápida
    items: ItemFacturable[]; // Consumos, noches, etc.
}

export interface DatosFacturaPDF {
    numeroComprobante: string;
    fechaEmision: string;
    tipoFactura: "A" | "B" | "C";
    cliente: PayerDTO;
    items: ItemFacturable[];
    total: number;
}