import { getTopicStats } from "@/lib/leetcode";
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
    const topics = await getTopicStats(username);

    return jsonSuccess({
      username,
      topics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
