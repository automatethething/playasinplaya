type MeasureTextHeightInput = {
  text: string;
  width: number;
  font: string;
  lineHeight: number;
  whiteSpace?: "normal" | "pre-wrap";
};

type MeasureTextHeightOutput = {
  height: number;
  lineCount: number;
};

/**
 * Client-side text measurement helper powered by @chenglou/pretext.
 *
 * Use this when you need stable heights for virtualized lists, masonry layouts,
 * or dynamic card text without DOM measurement/reflow probes.
 */
export async function measureTextHeight({
  text,
  width,
  font,
  lineHeight,
  whiteSpace = "normal",
}: MeasureTextHeightInput): Promise<MeasureTextHeightOutput> {
  if (typeof window === "undefined") {
    return { height: lineHeight, lineCount: 1 };
  }

  const { prepare, layout } = await import("@chenglou/pretext");

  const prepared = prepare(text, font, { whiteSpace });

  const result = layout(prepared, width, lineHeight);

  return {
    height: result.height,
    lineCount: result.lineCount,
  };
}
