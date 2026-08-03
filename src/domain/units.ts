export type Length = number;
export type Angle = number;

export type Dimensions = {
  x: Length;
  y: Length;
  z: Length;
};

export type LengthUnit = "mm" | "cm" | "m";

export const mm = (value: number): Length => value;

export function toMillimetres(value: number, unit: LengthUnit): Length {
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * 10;
    case "m":
      return value * 1000;
  }
}

export const dimensions = (x: Length, y: Length, z: Length): Dimensions => ({ x, y, z });
