export interface BuscarHuespedRequestDTO {
    huesped: {
        nombre: string | null;
        apellido: string | null;
        tipoDoc: { tipoDocumento: string } | null;
        numDoc: string | null;
    } | null;
}
