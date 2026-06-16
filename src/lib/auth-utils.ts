import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/user";

export async function getAuthUser(): Promise<IUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  await connectDB();
  return User.findOne({ email: session.user.email });
}

export async function requireAuthUser(): Promise<IUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
