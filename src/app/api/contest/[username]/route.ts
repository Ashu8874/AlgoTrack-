import { getDashboardData } from "@/lib/leetcode";
import { handleApiError, jsonSuccess, usernameParamSchema } from "@/lib/api/route-utils";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { username } = usernameParamSchema.parse(await params);
    const { contest, calendar: submissionCalendar } = await getDashboardData(username);

    return jsonSuccess({
      username,
      contest,
      submissionCalendar,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
