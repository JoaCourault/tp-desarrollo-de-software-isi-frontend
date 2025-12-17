import { DireccionDTO } from "../Direccion/Direccion.dto";
import { HuespedDTO } from "../Huesped/AltaHuespedRequest.dto";

export interface ResponsableDePago {
    idResponsableDePago?: string;
    tipo: "PERSONA_FISICA" | "PERSONA_JURIDICA";
    //Campos para persona juridica
    cuit?: string;
    telefono?: string;
    razonSocial?: string;
    direccion?: DireccionDTO;
    //Campo para persona fisica
    huesped?: HuespedDTO;
}