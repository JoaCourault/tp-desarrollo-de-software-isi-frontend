import { Resultado } from "../Resultado";
import { HuespedDTO } from "./Huesped.dto";

export interface AltaHuespedResultDTO {
    resultado: Resultado;
    huesped: HuespedDTO | null;
}
