import { Piece } from "../../lib/AbstractShapeMaker";
import { EnclosureV2Groups, EnclosureV2Materials } from "./consts";

export const calculatePrices = (pieces: Piece[]) => {
  const singlePieces = pieces.filter(
    (p) => p.material === EnclosureV2Materials.AluminiumSingle,
  );
  const doublePieces = pieces.filter(
    (p) => p.material === EnclosureV2Materials.AluminiumDouble,
  );
  const singlePieceTotalHeight = singlePieces.reduce(
    (sum, p) => sum + p.geometry.height,
    0,
  );
  const doublePieceTotalHeight = doublePieces.reduce(
    (sum, p) => sum + p.geometry.height,
    0,
  );
  const PRICE_3030 = 9.58; // price per meter for 30x30 aluminium extrusion
  const PRICE_3060 = 14.81; // price per meter for 30x60 aluminium extrusion

  const priceSingle = (singlePieceTotalHeight / 100) * PRICE_3030;
  const priceDouble = (doublePieceTotalHeight / 100) * PRICE_3060;
  console.log(`Total price for single pieces: ${priceSingle.toFixed(2)}€`);
  console.log(`Total price for double pieces: ${priceDouble.toFixed(2)}€`);
  console.log(
    `Overall total price: ${(priceSingle + priceDouble).toFixed(2)}€`,
  );
};
