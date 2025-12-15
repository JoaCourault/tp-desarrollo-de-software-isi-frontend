export interface DireccionDTO {
    id?: string | null;   // backend: id_direccion
    calle: string;
    numero: string | number;
    departamento: string | null;  // backend: depto
    piso: string | null;          // backend: Integer
    codigoPostal: string;                   // backend: cp (string)
    localidad: string;
    provincia: string;
    pais: string;
    idHuesped?: string | null;    // backend lo maneja internamente
    cuit?: string | null;         // backend lo maneja internamente
}
