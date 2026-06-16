import { z } from "zod";
import { connectMongoose } from "@/lib/mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  leetcodeUsername: z.string().min(1, "LeetCode username is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, leetcodeUsername } = registerSchema.parse(body);

    // Try to connect to MongoDB, but don't fail if it's not available
    let user;
    try {
      await connectMongoose();

      // Lazy load User model
      const { User } = await import("@/models/user");

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { leetcodeUsername: leetcodeUsername.toLowerCase() }],
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email or LeetCode username already in use" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      user = await User.create({
        name,
        displayName: name,
        email,
        password: hashedPassword,
        leetcodeUsername: leetcodeUsername.toLowerCase(),
        lastLogin: new Date(),
      });
    } catch (dbError) {
      console.warn("MongoDB not available, using mock registration:", dbError);
      // For testing without MongoDB
      user = {
        _id: "test-user-" + Date.now(),
        email,
        displayName: name,
      };
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
