import { PaidOrder, Taxes } from '@couture-next/types';
import { createWriteStream } from 'fs';
import * as PDFDocument from 'pdfkit';

export async function generateInvoice(order: PaidOrder<'bank-transfert' | 'card'>) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const path = `/tmp/${order._id}.pdf`;

  // Client info
  const clientInfos = [
    'Adresser la facture à',
    order.billing.firstName + ' ' + order.billing.lastName,
    order.billing.address,
    order.billing.addressComplement,
    order.billing.zipCode + ' ' + order.billing.city,
    order.billing.country,
  ]
    .filter((x) => x)
    .map((txt) => txt.replace(/\n/g, ' '))
    .join('\n');

  // Title
  doc.fontSize(20).text('Petit Roudoudou', { align: 'center' }).fontSize(12).moveDown(1.5);
  const titleBottom = doc.y;

  // Compagny info
  doc
    .text('Petit Roudoudou')
    .text('3 rue du chemin blanc')
    .text('54000 Nancy')
    .text('France')
    .text('SIREN: 888513983')
    .moveDown(1.5)
    .text(clientInfos)
    .moveDown(1.5);

  const prevY = doc.y;
  doc.y = titleBottom;
  doc.x = doc.page.margins.left;
  doc
    .text('Facture n°: PR' + order.reference.toString().padStart(6, '0'), { align: 'right' })
    .text('Date: ' + order.paidAt.toLocaleDateString('fr-FR'), { align: 'right' })
    .moveDown(0.5)
    .text('Acquittée', { align: 'right' })
    .text('Le ' + order.paidAt.toLocaleDateString('fr-FR') + ' à ' + order.paidAt.toLocaleTimeString('fr-FR'), {
      align: 'right',
    })
    .text('Moyen de paiement: ' + (order.paymentMethod === 'bank-transfert' ? 'Virement bancaire' : 'Carte bancaire'), {
      align: 'right',
    });
  doc.y = prevY;

  doc.moveDown(2);

  // header
  generateRow(doc, ['Désignation', 'Quantité', 'Prix unitaire', 'Prix total HT'], '#D27A0F', 'white');
  doc.moveDown(0.5);

  // items
  order.items.forEach((item) => {
    generateRow(doc, [
      item.description,
      item.quantity.toString(),
      item.originalPerUnitTaxExcluded.toFixed(2),
      item.originalTotalTaxExcluded.toFixed(2),
    ]);
    generateDiscountRow(doc, order.promotionCode?.code, item.originalTotalTaxExcluded, item.totalTaxExcluded);
    doc.moveDown(0.7);
  });

  // extras
  if (order.extras.reduceManufacturingTimes) {
    const price = order.extras.reduceManufacturingTimes.price.priceTaxExcluded.toFixed(2);
    generateRow(doc, ['Supplément commande urgente', '1', price, price]);
    doc.moveDown(0.7);
  }

  // shipping
  generateRow(doc, [
    'Frais de port',
    '1',
    order.shipping.price.taxExcluded.toFixed(2),
    order.shipping.price.taxExcluded.toFixed(2),
  ]);
  generateDiscountRow(
    doc,
    order.promotionCode?.code,
    order.shipping.price.originalTaxIncluded,
    order.shipping.price.taxIncluded
  );
  doc.moveDown(2);

  // sub total
  doc.fontSize(16).moveDown(0.3);
  generateRow(doc, ['', '', 'Total HT', order.totalTaxExcluded.toFixed(2) + ' €'], undefined, '#D27A0F');
  doc.fontSize(12).moveDown(0.7);

  // taxes
  generateRow(doc, ['', '', 'TVA 20%', order.taxes[Taxes.VAT_20].toFixed(2) + ' €']);
  doc.moveDown(0.7);

  // total
  doc.fontSize(16).moveDown(0.3);
  generateRow(doc, ['', '', 'Total TTC', order.totalTaxIncluded.toFixed(2) + ' €'], undefined, '#D27A0F');
  doc.fontSize(12);

  const fs = createWriteStream(path);
  doc.pipe(fs);

  await new Promise((resolve, reject) => {
    fs.on('finish', resolve);
    fs.on('error', reject);
    doc.end();
  });

  return path;
}

function generateRow(
  doc: typeof PDFDocument,
  [description, quantity, unitPrice, totalPrice]: [string, string, string, string],
  backgroundColor?: string,
  color?: string
) {
  const y = doc.y;
  if (backgroundColor) {
    const textHeight = doc.heightOfString(description, { width: 300 - doc.page.margins.left });
    const padding = 4;
    doc
      .rect(
        doc.page.margins.left - padding,
        y - 2 - padding,
        doc.page.width - doc.page.margins.left - doc.page.margins.right + padding * 2,
        textHeight + 2 + padding * 2
      )
      .fill(backgroundColor);
  }
  doc
    .fillColor(color ?? 'black')
    .text(description, doc.page.margins.left, y, { width: 300 - doc.page.margins.left })
    .text(quantity.toString(), 300, y, { width: 50, align: 'right' })
    .text(unitPrice.toString(), 350, y, { width: 70, align: 'right' })
    .text(totalPrice.toString(), 0, y, { align: 'right' })
    .fillColor('black');

  if (backgroundColor) doc.y += 4;
}

function generateDiscountRow(
  doc: typeof PDFDocument,
  discontLabel: string | undefined,
  originalPrice: number,
  finalPrice: number
) {
  const percentage = ((originalPrice - finalPrice) / originalPrice) * 100;
  if (percentage < 0 + Number.EPSILON) return;
  generateRow(doc, [
    'Remise "' + discontLabel + '"',
    '',
    percentage.toFixed(2) + '%',
    '-' + (originalPrice - finalPrice).toFixed(2),
  ]);
}
