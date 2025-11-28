"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type FormState = {
  error: string | null;
};

export async function login(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  if (!data.email || !data.password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  // Success
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    username: formData.get("username") as string,
  };

  if (!data.email || !data.password || !data.username) {
    return { error: "All fields are required." };
  }
  if (data.password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
      },
    },
  });

  if (error) {
    console.error("Sign-up Error:", error.message);
    if (error.message.includes("User already registered")) {
      return { error: "An account with this email already exists." };
    }
    return {
      error: "Error creating account. Please try again.",
    };
  }

  // Success
  redirect("/check-email");
}

export async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
