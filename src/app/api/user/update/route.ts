import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  leetcodeUsername: z.string().min(1, "LeetCode username is required"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leetcodeUsername } = updateSchema.parse(body);

    await connectMongoose();

    // Lazy load User model
    const { User } = await import("@/models/user");

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { leetcodeUsername: leetcodeUsername.toLowerCase() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
