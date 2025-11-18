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
    return { error: "Correo electrónico y contraseña son requeridos." };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: "Correo electrónico o contraseña inválidos." };
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
    return { error: "Todos los campos son requeridos." };
  }
  if (data.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
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
      return { error: "Ya existe una cuenta con este correo electrónico." };
    }
    return {
      error: "Error al crear la cuenta. Por favor, inténtalo de nuevo.",
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
