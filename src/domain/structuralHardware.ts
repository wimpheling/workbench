import { hardwareId, type HardwareId } from "./ids";
import type { HardwareRequirement } from "./connections";

export type StructuralConnector = Readonly<{
  id: HardwareId;
  manufacturer: "Wolweiss";
  productCode: "CAC30UN" | "CBR3030" | "CBR3060";
  cadFile: "CAC30UN.step" | "CBR3030.step" | "CBR3060.step";
  productUrl: string;
  installation: "internal-anchor" | "external-bracket";
  machining: "vendor-specification-required" | "none";
  hardwarePerInstallation: readonly HardwareRequirement[];
}>;

const cbr3030Hardware: readonly HardwareRequirement[] = [
  {
    id: "hardware:wolweiss-cbr3030",
    specification: "Wolweiss CBR3030 30 × 30 bracket",
    quantity: 1,
  },
  {
    id: "hardware:iso4762-m6x14",
    specification: "ISO 4762 M6 × 14 socket-head cap screw",
    quantity: 2,
  },
  {
    id: "hardware:iso7089-m6",
    specification: "ISO 7089 M6 washer",
    quantity: 2,
  },
  {
    id: "hardware:slot8-m6-nut",
    specification: "Slot-8 M6 T-nut",
    quantity: 2,
  },
];

const cbr3060Hardware: readonly HardwareRequirement[] = [
  {
    id: "hardware:wolweiss-cbr3060",
    specification: "Wolweiss CBR3060 30 × 60 bracket",
    quantity: 1,
  },
  {
    id: "hardware:iso4762-m6x14",
    specification: "ISO 4762 M6 × 14 socket-head cap screw",
    quantity: 4,
  },
  {
    id: "hardware:iso7089-m6",
    specification: "ISO 7089 M6 washer",
    quantity: 4,
  },
  {
    id: "hardware:slot8-m6-nut",
    specification: "Slot-8 M6 T-nut",
    quantity: 4,
  },
];

export const wolweissCac30un: StructuralConnector = {
  id: hardwareId("wolweiss-cac30un"),
  manufacturer: "Wolweiss",
  productCode: "CAC30UN",
  cadFile: "CAC30UN.step",
  productUrl: "https://reiman.pt/pt/wlw-cac30un-cac30un-universal-anchor-connector-30-profile/",
  installation: "internal-anchor",
  // The supplied product drawing identifies the connector geometry, but not a
  // complete cut-end machining/fastener schedule. Keep this visible in the BOM.
  machining: "vendor-specification-required",
  hardwarePerInstallation: [
    {
      id: "hardware:wolweiss-cac30un",
      specification: "Wolweiss CAC30UN universal anchor connector",
      quantity: 1,
      notes: [
        "Concealed main-frame connector; supplier-performed cut-end machining required.",
        "Fastening and machining dimensions are vendor-defined pending the current installation drawing.",
      ],
    },
  ],
};

export const wolweissCbr3030: StructuralConnector = {
  id: hardwareId("wolweiss-cbr3030"),
  manufacturer: "Wolweiss",
  productCode: "CBR3030",
  cadFile: "CBR3030.step",
  productUrl: "https://reiman.pt/pt/wlw-cbr3030-cbr3030-30x30-bracket/",
  installation: "external-bracket",
  machining: "none",
  hardwarePerInstallation: cbr3030Hardware,
};

export const wolweissCbr3060: StructuralConnector = {
  id: hardwareId("wolweiss-cbr3060"),
  manufacturer: "Wolweiss",
  productCode: "CBR3060",
  cadFile: "CBR3060.step",
  productUrl: "https://reiman.pt/pt/wlw-cbr3060-cbr3060-30x60-bracket/",
  installation: "external-bracket",
  machining: "none",
  hardwarePerInstallation: cbr3060Hardware,
};

export const selectedStructuralConnectors = {
  cac30un: wolweissCac30un,
  cbr3030: wolweissCbr3030,
  cbr3060: wolweissCbr3060,
} as const;
