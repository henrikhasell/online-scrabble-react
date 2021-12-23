export type TileType = "normal"
              | "double_letter"
              | "double_word"
              | "triple_letter"
              | "triple_word"
              | "start";

interface TileModel {
  type: TileType;
  cross_check: boolean;
  value: string | null;
  wild: boolean;
}

export default TileModel;