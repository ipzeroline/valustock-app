import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07111f",
        }}
      >
        <div
          style={{
            width: 388,
            height: 388,
            borderRadius: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
            color: "#06111f",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 248,
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          V
        </div>
      </div>
    ),
    size,
  );
}
