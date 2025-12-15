// src/dto/Huesped/AltaHuespedRequest.dto.ts

export interface TipoDocumentoDTO {
    tipoDocumento: string;
}

export interface DireccionDTO {
    calle: string | null;
    numero: string | null;
    departamento: string | null;
    piso: number | null;
    cp: string | null;
    localidad: string | null;
    provincia: string | null;
    pais: string | null;
    id: string | null;
}

export interface HuespedDTO {
    idHuesped: string | null;
    nombre: string;
    apellido: string;
    tipoDocumento: TipoDocumentoDTO;
    numDoc: string;
    posicionIva: string;
    cuit: string | null;
    fechaNacimiento: string;
    telefono: string;
    email: string;
    ocupacion: string;
    nacionalidad: string;
    direccion: DireccionDTO;
    idsEstadias: string[];
    eliminado: boolean;
}

export interface AltaHuespedRequestDTO {
    huesped: HuespedDTO;
}
