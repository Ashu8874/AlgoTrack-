import { connectMongoose } from "../mongoose";
import { User as UserModel, type IUser } from "@/models/user";

export type CreateUserInput = Pick<IUser, "leetcodeUsername"> &
  Partial<Pick<IUser, "avatar" | "name" | "email">>;

export async function createUser(input: CreateUserInput) {
  await connectMongoose();
  return UserModel.create(input);
}

export async function getUser(
  query: { leetcodeUsername: string } | { email: string } | { id: string },
) {
  await connectMongoose();

  if ("id" in query) {
    return UserModel.findById(query.id).exec();
  }

  return UserModel.findOne(query).exec();
}
