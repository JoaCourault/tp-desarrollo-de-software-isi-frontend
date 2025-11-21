export interface BuscarHuespedRequestDTO {
    huesped: {
        nombre: string | null;
        apellido: string | null;
        tipoDocumento: { tipoDocumento: string } | null;
        numDoc: string | null;
    } | null;
}
