import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSignedUploadParams } from "@/lib/cloudinary";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const params = generateSignedUploadParams();
    return NextResponse.json(params);
  } catch {
    return NextResponse.json(
      { error: "Error generando parámetros de upload" },
      { status: 500 }
    );
  }
}
