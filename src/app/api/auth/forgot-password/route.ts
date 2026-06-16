import { z } from "zod";
import { connectMongoose } from "@/lib/mongoose";
import { User } from "@/models";
import { NextResponse } from "next/server";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    await connectMongoose();

    const user = await User.findOne({ email }).exec();

    // Don't reveal if user exists for security
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent" },
        { status: 200 }
      );
    }

    // TODO: In production, generate a reset token and send via email
    // For now, just acknowledge the request
    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
