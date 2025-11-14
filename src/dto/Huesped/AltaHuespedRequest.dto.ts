export interface AltaHuespedRequestDTO {
    huesped: {
        idHuesped: string | null;
        nombre: string;
        apellido: string;
        tipoDocumento: {
            tipoDocumento: string;
        };
        numDoc: string;
        posicionIva: string;
        cuit: string;
        fechaNacimiento: string;
        telefono: string;
        email: string;
        ocupacion: string;
        nacionalidad: string;
        direccion: {
            calle: string;
            numero: string;
            departamento: string;
            piso: string;
            cp: string;
            localidad: string;
            provincia: string;
            pais: string;
            id: string | null;
        };
        idsEstadias: string[];
        eliminado: boolean;
    };
}
