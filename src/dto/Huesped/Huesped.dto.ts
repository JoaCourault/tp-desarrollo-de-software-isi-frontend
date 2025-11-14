import { TipoDocumentoDTO } from "./TipoDocumento.dto";
import { DireccionDTO } from "../Direccion/Direccion.dto";

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
    email: string | null;
    ocupacion: string;
    nacionalidad: string;
    direccion: DireccionDTO;
    idsEstadias: string[];
    eliminado: boolean;
}
