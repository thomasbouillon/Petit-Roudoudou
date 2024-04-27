import { File, Order } from '@prisma/client';
import { createReadStream, createWriteStream } from 'fs';
import PDFDocument from 'pdfkit';
import { Context } from '../../context';
import { getPublicUrl } from '@couture-next/utils';

/**
 * Generate an invoice and save it in a local file
 * @returns path to invoice
 */
export async function generateInvoice(order: Order): Promise<string> {
  if (order.status !== 'PAID') {
    throw new Error('Cannot generate invoice for an order that is not paid');
  }

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const path = `/tmp/${order.id}.pdf`;

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
    .text('Date: ' + order.paidAt!.toLocaleDateString('fr-FR'), { align: 'right' })
    .moveDown(0.5)
    .text('Acquittée', { align: 'right' })
    .text('Le ' + order.paidAt!.toLocaleDateString('fr-FR') + ' à ' + order.paidAt!.toLocaleTimeString('fr-FR'), {
      align: 'right',
    })
    .text(
      'Moyen de paiement: ' +
        (order.billing.paymentMethod === 'BANK_TRANSFER'
          ? 'Virement bancaire'
          : order.billing.paymentMethod === 'CARD'
          ? 'Carte bancaire'
          : 'Carte cadeau'),
      {
        align: 'right',
      }
    );
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
  if (order.giftOffered) {
    generateRow(doc, ['Cadeau offert', '1', '0.00', '0.00']);
    doc.moveDown(0.7);
  }

  // extras
  if (order.extras.reduceManufacturingTimes) {
    const price = order.extras.reduceManufacturingTimes.priceTaxExcluded.toFixed(2);
    generateRow(doc, ['Supplément commande urgente', '1', price, price]);
    doc.moveDown(0.7);
  }

  // shipping
  if (
    !(['do-not-ship', 'pickup-at-workshop'] as Order['shipping']['deliveryMode'][]).includes(
      order.shipping.deliveryMode
    )
  ) {
    // no shipping line for orders that do not require shipping
    generateRow(doc, [
      'Frais de port',
      '1',
      order.shipping.price.originalTaxExcluded.toFixed(2),
      order.shipping.price.originalTaxExcluded.toFixed(2),
    ]);
    generateDiscountRow(
      doc,
      order.promotionCode?.type === 'FREE_SHIPPING' ? order.promotionCode.code : 'Frais de port offerts',
      order.shipping.price.originalTaxExcluded,
      order.shipping.price.taxExcluded
    );
  }
  doc.moveDown(2);

  // sub total
  doc.fontSize(16).moveDown(0.3);
  generateRow(doc, ['', '', 'Total HT', order.totalTaxExcluded.toFixed(2) + ' €'], undefined, '#D27A0F');
  doc.fontSize(12).moveDown(0.7);

  // taxes
  // TODO uncomment when roudoudou will be subject to VAT
  // generateRow(doc, ['', '', 'TVA 20%', order.taxes[Taxes.VAT_20].toFixed(2) + ' €']);
  // doc.moveDown(0.7);
  doc.fontSize(10);
  generateRow(doc, ['', '', '', 'TVA non applicable, art. 293 B du CGI']);
  doc.fontSize(12).moveDown(0.7);

  // total
  doc.fontSize(16).moveDown(0.3);
  generateRow(doc, ['', '', 'Total TTC', order.totalTaxIncluded.toFixed(2) + ' €'], undefined, '#D27A0F');
  doc.fontSize(12);

  if (!!order.billing.amountPaidWithGiftCards) {
    doc.moveDown(2);
    generateRow(doc, ['', '', 'Payé par carte cadeau', order.billing.amountPaidWithGiftCards.toFixed(2) + ' €']);
  }

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
    '-' + percentage.toFixed(2) + '%',
    '-' + (originalPrice - finalPrice).toFixed(2),
  ]);
}

export async function uploadInvoiceToStorage(ctx: Context, orderId: string, pathToInvoice: string): Promise<File> {
  const fileUid = `orders/${orderId}/invoice.pdf`;
  const fileRef = ctx.storage.bucket().file(fileUid);
  const readStream = createReadStream(pathToInvoice);
  await fileRef.save(readStream);
  return {
    uid: fileUid,
    url: getPublicUrl(fileUid, ctx.environment),
  };
}
