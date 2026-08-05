import type {
  MachiningDefinition,
  MachiningDimension,
  MachiningReference,
  ProfileEnd,
  ProfileEndDrawingView,
  ProfileReferenceFace,
  SupplierMachiningInstruction,
} from "./machining";

const endLabel: Readonly<Record<ProfileEnd, string>> = {
  start: "início",
  end: "fim",
};

const drawingViewLabel: Readonly<Record<ProfileEndDrawingView, string>> = {
  "looking-at-start-end": "vista da extremidade de início",
  "looking-at-end-end": "vista da extremidade de fim",
};

const faceLabel: Readonly<Record<ProfileReferenceFace, string>> = {
  front: "frente",
  back: "traseira",
  left: "esquerda",
  right: "direita",
  top: "superior",
  bottom: "inferior",
};

const processLabel: Readonly<Record<SupplierMachiningInstruction["process"], string>> = {
  drill: "furação",
  counterbore: "furo rebaixado",
  mill: "fresagem",
  tap: "rosca",
  "supplier-defined": "operação definida pelo fornecedor",
};

const formatDimension = (dimension: MachiningDimension): string => {
  const tolerance =
    dimension.toleranceMm === undefined ? "" : `; tolerância ±${dimension.toleranceMm} mm`;
  return `${dimension.name} (${dimension.kind}): ${dimension.valueMm} mm${tolerance}`;
};

const formatReference = (reference: MachiningReference): string => {
  const revision = reference.revision === undefined ? "" : `; revisão ${reference.revision}`;
  return `${reference.id} (${reference.kind}): ${reference.locator}${revision}`;
};

const formatDefinition = (definition: MachiningDefinition): readonly string[] =>
  definition.status === "dimensioned"
    ? [
        "- Dimensões:",
        ...definition.dimensions.map((dimension) => `  - ${formatDimension(dimension)}`),
      ]
    : [
        "- Dimensões: pendentes do desenho de instalação/maquinação atualizado do fornecedor.",
        "  - Não inferir furos, profundidades ou tolerâncias a partir deste pedido.",
      ];

const renderInstruction = (instruction: SupplierMachiningInstruction): readonly string[] => [
  `Operação ${instruction.operationId} — ${instruction.operationName}`,
  `- Peça: ${instruction.target.partId}`,
  `- Extremidade: ${endLabel[instruction.target.end]}`,
  `- Vista do desenho: ${drawingViewLabel[instruction.target.orientation.drawingView]}`,
  `- Face de referência no topo: ${faceLabel[instruction.target.orientation.topReferenceFace]}`,
  `- Conector: ${instruction.connectorProductCode}; operação: ${instruction.connectorOperationCode}`,
  `- Processo: ${processLabel[instruction.process]}`,
  ...formatDefinition(instruction.definition),
  "- Referências:",
  ...instruction.references.map((reference) => `  - ${formatReference(reference)}`),
  `- Juntas relacionadas: ${instruction.jointIds.join(", ")}`,
];

/**
 * Produces a concise, reviewable Portuguese request using only the approved
 * supplier machining instructions. It does not infer any connector operations.
 */
export const renderVendorMachiningConfirmationRequest = (
  instructions: readonly SupplierMachiningInstruction[],
): string =>
  [
    "Assunto: Pedido de confirmação de corte e maquinação",
    "",
    "Olá,",
    "",
    "Antes de cortarem ou maquinarem os perfis, por favor confirmem por escrito que conseguem executar cada operação abaixo exatamente como indicada.",
    "A vista identifica a extremidade observada; a face de referência indicada deve ficar no topo dessa vista, para evitar qualquer espelhamento.",
    "",
    ...instructions.flatMap((instruction, index) => [
      ...(index === 0 ? [] : [""]),
      ...renderInstruction(instruction),
    ]),
    "",
    "Confirmação necessária para cada operação:",
    "- a peça, a extremidade e a orientação/face de referência no topo;",
    "- o conector, o código da operação e todas as dimensões indicadas — ou, quando marcadas como pendentes, o desenho de instalação/maquinação que as define;",
    "- a referência técnica aplicável e a respetiva revisão, quando indicada.",
    "",
    "Se algum ponto não puder ser executado como indicado, por favor sinalizem-no antes de cortar qualquer perfil.",
    "",
    "Obrigado.",
  ].join("\n");
