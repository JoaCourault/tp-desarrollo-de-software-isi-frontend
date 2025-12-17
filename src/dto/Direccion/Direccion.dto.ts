export interface DireccionDTO {
    id: string | null;
    calle: string;
    numero: string;
    departamento: string;
    piso: string | null;

    codigoPostal: string;
    localidad: string;
    provincia: string;
    pais: string;
}