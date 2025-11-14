export interface DireccionDTO {
    id: string | null;
    pais: string;
    provincia: string;
    localidad: string;
    codigoPostal: number;
    calle: string;
    numero: number | string;
    departamento: string | null;
    piso: number | string;
}
