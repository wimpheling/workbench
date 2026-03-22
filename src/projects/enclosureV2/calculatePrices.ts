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
  console.log("Single pieces total height:", singlePieceTotalHeight);
  const numberOfSinglePiecesHeightBelow40 = singlePieces.filter(
    (p) => p.geometry.height < 40,
  ).length;
  const numberOfSinglePiecesHeightBetween40And50 = singlePieces.filter(
    (p) => p.geometry.height >= 40 && p.geometry.height < 50,
  ).length;
  const numberOfSinglePiecesHeightBetween50And60 = singlePieces.filter(
    (p) => p.geometry.height >= 50 && p.geometry.height < 60,
  ).length;
  const numberOfSinglePiecesHeightBetween60And70 = singlePieces.filter(
    (p) => p.geometry.height >= 60 && p.geometry.height < 70,
  ).length;
  const numberOfSinglePiecesHeightBetween70And80 = singlePieces.filter(
    (p) => p.geometry.height >= 70 && p.geometry.height < 80,
  ).length;
  const numberOfSinglePiecesHeightBetween80And90 = singlePieces.filter(
    (p) => p.geometry.height >= 80 && p.geometry.height < 90,
  ).length;
  const numberOfSinglePiecesHeightBetween90And100 = singlePieces.filter(
    (p) => p.geometry.height >= 90 && p.geometry.height < 100,
  ).length;
  const numberOfSinglePiecesHeightBetween100And110 = singlePieces.filter(
    (p) => p.geometry.height >= 100 && p.geometry.height < 110,
  ).length;
  const numberOfSinglePiecesHeightBetween110And120 = singlePieces.filter(
    (p) => p.geometry.height >= 110 && p.geometry.height < 120,
  ).length;
  const numberOfSinglePiecesHeightBetween120And130 = singlePieces.filter(
    (p) => p.geometry.height >= 120 && p.geometry.height < 130,
  ).length;
  const numberOfSinglePiecesHeightBetween130And140 = singlePieces.filter(
    (p) => p.geometry.height >= 130 && p.geometry.height < 140,
  ).length;
  const numberOfSinglePiecesHeightBetween140And150 = singlePieces.filter(
    (p) => p.geometry.height >= 140 && p.geometry.height < 150,
  ).length;

  console.log({
    numberOfSinglePiecesHeightBelow40,
    numberOfSinglePiecesHeightBetween40And50,
    numberOfSinglePiecesHeightBetween50And60,
    numberOfSinglePiecesHeightBetween60And70,
    numberOfSinglePiecesHeightBetween70And80,
    numberOfSinglePiecesHeightBetween80And90,
    numberOfSinglePiecesHeightBetween90And100,
    numberOfSinglePiecesHeightBetween100And110,
    numberOfSinglePiecesHeightBetween110And120,
    numberOfSinglePiecesHeightBetween120And130,
    numberOfSinglePiecesHeightBetween130And140,
    numberOfSinglePiecesHeightBetween140And150,
  });

  // same for double pieces height distribution
  const numberOfDoublePiecesHeightBelow40 = doublePieces.filter(
    (p) => p.geometry.height < 40,
  ).length;
  const numberOfDoublePiecesHeightBetween40And50 = doublePieces.filter(
    (p) => p.geometry.height >= 40 && p.geometry.height < 50,
  ).length;
  const numberOfDoublePiecesHeightBetween50And60 = doublePieces.filter(
    (p) => p.geometry.height >= 50 && p.geometry.height < 60,
  ).length;
  const numberOfDoublePiecesHeightBetween60And70 = doublePieces.filter(
    (p) => p.geometry.height >= 60 && p.geometry.height < 70,
  ).length;
  const numberOfDoublePiecesHeightBetween70And80 = doublePieces.filter(
    (p) => p.geometry.height >= 70 && p.geometry.height < 80,
  ).length;
  const numberOfDoublePiecesHeightBetween80And90 = doublePieces.filter(
    (p) => p.geometry.height >= 80 && p.geometry.height < 90,
  ).length;
  const numberOfDoublePiecesHeightBetween90And100 = doublePieces.filter(
    (p) => p.geometry.height >= 90 && p.geometry.height < 100,
  ).length;
  const numberOfDoublePiecesHeightBetween100And110 = doublePieces.filter(
    (p) => p.geometry.height >= 100 && p.geometry.height < 110,
  ).length;
  const numberOfDoublePiecesHeightBetween110And120 = doublePieces.filter(
    (p) => p.geometry.height >= 110 && p.geometry.height < 120,
  ).length;
  const numberOfDoublePiecesHeightBetween120And130 = doublePieces.filter(
    (p) => p.geometry.height >= 120 && p.geometry.height < 130,
  ).length;
  const numberOfDoublePiecesHeightBetween130And140 = doublePieces.filter(
    (p) => p.geometry.height >= 130 && p.geometry.height < 140,
  ).length;
  const numberOfDoublePiecesHeightBetween140And150 = doublePieces.filter(
    (p) => p.geometry.height >= 140 && p.geometry.height < 150,
  ).length;

  console.log({
    numberOfDoublePiecesHeightBelow40,
    numberOfDoublePiecesHeightBetween40And50,
    numberOfDoublePiecesHeightBetween50And60,
    numberOfDoublePiecesHeightBetween60And70,
    numberOfDoublePiecesHeightBetween70And80,
    numberOfDoublePiecesHeightBetween80And90,
    numberOfDoublePiecesHeightBetween90And100,
    numberOfDoublePiecesHeightBetween100And110,
    numberOfDoublePiecesHeightBetween110And120,
    numberOfDoublePiecesHeightBetween120And130,
    numberOfDoublePiecesHeightBetween130And140,
    numberOfDoublePiecesHeightBetween140And150,
  });

  const singlePrice =
    numberOfSinglePiecesHeightBetween70And80 * 4.77 +
    numberOfSinglePiecesHeightBetween80And90 * 5.3 +
    numberOfDoublePiecesHeightBetween70And80 * 8.91 +
    numberOfDoublePiecesHeightBelow40 * 4.81;

  console.error("singlePrice", singlePrice);

  const price3030 =
    numberOfSinglePiecesHeightBetween70And80 * 7.59 * 1.23 +
    numberOfSinglePiecesHeightBetween80And90 * 8.54 * 1.23 +
    numberOfDoublePiecesHeightBetween70And80 * 13.43 * 1.23 +
    numberOfDoublePiecesHeightBelow40 * 3.86 * 1.23;

  console.error("price3030", price3030);

  console.log("Double pieces total height:", doublePieceTotalHeight);
};
