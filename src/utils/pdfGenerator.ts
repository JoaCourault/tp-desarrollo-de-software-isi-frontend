import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DatosFacturaPDF, PersonaFisicaDTO, PersonaJuridicaDTO } from "@/src/dto/Facturacion.dto";

export const generarFacturaPDF = (datos: DatosFacturaPDF) => {
    const doc = new jsPDF();

    // --- ENCABEZADO EMPRESA ---
    doc.setFontSize(22);
    doc.text("Flower Hotel", 14, 20);
    doc.setFontSize(10);
    doc.text("Av. Siempreviva 123, Santa Fe, Argentina", 14, 26);
    doc.text("IVA Responsable Inscripto", 14, 31);

    // --- DATOS DEL COMPROBANTE ---
    doc.setFontSize(14);
    doc.text(`FACTURA ${datos.tipoFactura}`, 150, 20); // Usamos el tipo dinámico (A o B)
    doc.setFontSize(10);
    doc.text(`N°: ${datos.numeroComprobante}`, 150, 26);
    doc.text(`Fecha: ${datos.fechaEmision}`, 150, 31);

    // --- DATOS DEL CLIENTE (Responsable de Pago) ---
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);

    doc.setFontSize(12);
    doc.text("Datos del Cliente", 14, 42);
    doc.setFontSize(10);

    const esJuridica = datos.cliente.esPersonaJuridica;
    const nombreStr = esJuridica
        ? (datos.cliente as PersonaJuridicaDTO).razonSocial
        : `${(datos.cliente as PersonaFisicaDTO).nombre} ${(datos.cliente as PersonaFisicaDTO).apellido}`;

    const docStr = esJuridica
        ? `CUIT: ${(datos.cliente as PersonaJuridicaDTO).cuit}`
        : `DNI: ${(datos.cliente as PersonaFisicaDTO).dni}`;

    doc.text(`Nombre/Razón Social: ${nombreStr}`, 14, 48);
    doc.text(docStr, 14, 53);

    // Validamos que direccion exista para evitar error si viene null
    const dir = datos.cliente.direccion;
    const dirStr = dir ? `${dir.calle} ${dir.numero}, ${dir.ciudad}` : "Dirección no informada";
    doc.text(`Dirección: ${dirStr}`, 14, 58);

    doc.text(`Teléfono: ${datos.cliente.telefono}`, 120, 53);

    // --- TABLA DE ITEMS ---
    const tableBody = datos.items.map(item => [
        item.cantidad,
        item.descripcion,
        `$ ${item.precioUnitario.toFixed(2)}`,
        `$ ${(item.cantidad * item.precioUnitario).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Cant.', 'Descripción', 'Precio Unit.', 'Subtotal']],
        body: tableBody,
        foot: [['', '', 'TOTAL', `$ ${datos.total.toFixed(2)}`]],
        theme: 'striped',
        headStyles: { fillColor: [136, 19, 55] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // --- DESCARGAR ---
    doc.save(`Factura_${datos.numeroComprobante}.pdf`);
};