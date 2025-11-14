import { Resultado } from "../Resultado";
import { HuespedDTO } from "./Huesped.dto";

export interface BuscarHuespedResultDTO {
    resultado: Resultado;
    huespedesEncontrados: HuespedDTO[];
}
