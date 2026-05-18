import { NextResponse } from "next/server";
import { parseGoogleForm, isValidGoogleFormUrl } from "@/lib/form-parser";
import { parseGoogleFormJac } from "@/lib/jac-form-parser";

const useJacParser =
  process.env.CAULIFORM_USE_JAC_PARSER === "1" ||
  process.env.CAULIFORM_USE_JAC_PARSER === "true";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidGoogleFormUrl(url)) {
      return NextResponse.json(
        { error: "Invalid Google Form URL" },
        { status: 400 }
      );
    }

    const formData = useJacParser
      ? await parseGoogleFormJac(url)
      : await parseGoogleForm(url);

    return NextResponse.json({
      success: true,
      data: formData,
    });
  } catch (error) {
    console.error("Error parsing form:", error);
    return NextResponse.json(
      { error: "Failed to parse form" },
      { status: 500 }
    );
  }
}
