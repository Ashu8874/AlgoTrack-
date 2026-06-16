import { NextResponse } from "next/server";

interface UserData {
  email: string;
  name: string;
}

export async function GET() {
  try {
    const { connectMongoose } = await import("@/lib/mongoose");
    await connectMongoose();
    
    const { User } = await import("@/models/user");
    const users = await User.find().limit(5);
    
    return NextResponse.json({
      status: "MongoDB is working",
      userCount: users.length,
      users: users.map((u: { email: string; name: string }) => ({
        email: u.email,
        name: u.name,
      } as UserData)),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      status: "MongoDB is NOT working",
      error: errorMessage,
      hint: "Check your MongoDB Atlas connection",
    });
  }
}
