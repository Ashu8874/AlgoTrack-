import { z } from "zod";
import { handleApiError } from "@/lib/api/route-utils";
import { buildPdfReportData, generatePdfReport } from "@/lib/reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportQuerySchema = z.object({
  username: z.string().trim().min(1).max(64),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { username } = exportQuerySchema.parse({
      username: searchParams.get("username"),
    });

    const reportData = await buildPdfReportData(username);
    const pdfArrayBuffer = await generatePdfReport(reportData);
    const filename = `${username}-leetcode-progress-report.pdf`;

    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
