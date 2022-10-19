import { Request, Response, Router } from "express";
import PDFMake from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";

import { prismaClient } from "./database/prismaClient";

const routes = Router();

routes.get("/products", async (request: Request, response: Response): Promise<Response> => {
  const products = await prismaClient.products.findMany();

  return response.json(products);
});

routes.get("/products/report", async (request: Request, response: Response): Promise<any> => {
  const products = await prismaClient.products.findMany();

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new PDFMake(fonts);

  const body = [];

  const columnsTitle: Object[] = [
    { text: "ID", style: "id" },
    { text: "Descrição", style: "columnsTitle" },
    { text: "Preço", style: "columnsTitle" },
    { text: "Quantidade", style: "columnsTitle" }
  ];

  body.push(columnsTitle);

  for await (let product of products) {
    const rows = new Array();
    rows.push(product.id);
    rows.push(product.description);
    rows.push(`R$ ${product.price}`);
    rows.push(product.quantity);

    body.push(rows);
  }

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: { font: "Helvetica" },
    content: [
      {
        columns: [
          { text: "Relatório de produtos", style: "header" },
          { text: "19/10/2022 12:00h\n\n", style: "header" }
        ]
      },
      {
        table:
        {
          heights: function () {
            return 30;
          },
          body
        }
      }
    ],
    footer: [{ text: "Relatório Code Drops", style: "footer" }],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: "center"
      },
      columnsTitle: {
        fontSize: 13,
        bold: true,
        fillColor: "#7159c1",
        color: "#FFF",
        alignment: "center",
        margin: 4
      },
      id: {
        fillColor: "#999",
        color: "#FFF",
        alignment: "center",
        margin: 4
      },
      footer: {
        alignment: "center"
      }
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const chunks: any[] = [];

  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  pdfDoc.on("end", () => {
    const result = Buffer.concat(chunks);

    response.end(result);
  });

  pdfDoc.end();
});

export { routes };