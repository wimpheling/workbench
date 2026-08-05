import { describe, expect, it } from "vitest";
import { partId } from "./ids";
import { machiningOperationId, type SupplierMachiningInstruction } from "./machining";
import { mm } from "./units";
import { renderVendorMachiningConfirmationRequest } from "./vendorMachiningDocument";

const instruction: SupplierMachiningInstruction = {
  operationId: machiningOperationId("front-left-post-top-cac30un"),
  operationName: "Maquinação do conector CAC30UN no topo do montante frontal esquerdo",
  connectorProductCode: "CAC30UN",
  connectorOperationCode: "CAC30UN-30-SERIES-END-MACHINING",
  process: "supplier-defined",
  target: {
    partId: partId("front-left-post"),
    end: "end",
    orientation: {
      drawingView: "looking-at-end-end",
      topReferenceFace: "front",
    },
  },
  definition: {
    status: "dimensioned",
    dimensions: [
      { name: "diâmetro do furo do conector", kind: "diameter", valueMm: mm(14) },
      { name: "profundidade do furo do conector", kind: "depth", valueMm: mm(21) },
    ],
  },
  references: [
    {
      id: "reference:wolweiss-cac30un-datasheet",
      kind: "supplier-technical-drawing",
      locator: "cac.pdf",
      revision: "R1",
    },
  ],
  partIds: [partId("front-left-post")],
  jointIds: ["front-left-post-top"],
  confirmationStatus: "vendor-confirmation-required",
  requiredConfirmations: [
    "target-end-and-clocking",
    "connector-operation-and-dimensions",
    "reference-revision",
  ],
};

describe("vendor machining confirmation document", () => {
  it("renders every supplier instruction datum without inferring an operation", () => {
    const document = renderVendorMachiningConfirmationRequest([instruction]);

    expect(document).toContain("Peça: part:front-left-post");
    expect(document).toContain("Extremidade: fim");
    expect(document).toContain("Vista do desenho: vista da extremidade de fim");
    expect(document).toContain("Face de referência no topo: frente");
    expect(document).toContain("Conector: CAC30UN; operação: CAC30UN-30-SERIES-END-MACHINING");
    expect(document).toContain("diâmetro do furo do conector (diameter): 14 mm");
    expect(document).toContain(
      "reference:wolweiss-cac30un-datasheet (supplier-technical-drawing): cac.pdf; revisão R1",
    );
  });

  it("asks explicitly for the required vendor confirmations", () => {
    expect(renderVendorMachiningConfirmationRequest([instruction])).toContain(
      "Confirmação necessária para cada operação:",
    );
    expect(renderVendorMachiningConfirmationRequest([instruction])).toContain(
      "a peça, a extremidade e a orientação/face de referência no topo;",
    );
    expect(renderVendorMachiningConfirmationRequest([instruction])).toContain(
      "o conector, o código da operação e todas as dimensões indicadas — ou, quando marcadas como pendentes, o desenho de instalação/maquinação que as define;",
    );
    expect(renderVendorMachiningConfirmationRequest([instruction])).toContain(
      "a referência técnica aplicável e a respetiva revisão, quando indicada.",
    );
  });

  it("makes supplier-defined dimensions visibly pending instead of inventing them", () => {
    const document = renderVendorMachiningConfirmationRequest([
      {
        ...instruction,
        definition: {
          status: "supplier-defined-pending",
          dimensions: [],
          pendingDetail: "dimensions-pending-vendor-drawing",
        },
      },
    ]);

    expect(document).toContain(
      "Dimensões: pendentes do desenho de instalação/maquinação atualizado do fornecedor.",
    );
    expect(document).toContain("Não inferir furos, profundidades ou tolerâncias");
  });
});
