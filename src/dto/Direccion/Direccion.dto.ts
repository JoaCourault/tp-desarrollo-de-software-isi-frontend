export interface DireccionDTO {
    idDireccion: string | null;   // backend: id_direccion
    calle: string;
    numero: string | number;
    departamento: string | null;  // backend: depto
    piso: number | null;          // backend: Integer
    cp: string;                   // backend: cp (string)
    localidad: string;
    provincia: string;
    pais: string;
    idHuesped?: string | null;    // backend lo maneja internamente
    cuit?: string | null;         // backend lo maneja internamente
}
