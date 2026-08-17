import {
  getCurrentUser,
  getRole,
  getSession,
  onAuthStateChange,
  signInAdmin,
  signOut
} from "../models/authModel";
import { authenticateFarmer } from "../models/farmerModel";

export async function loginAsAdmin(email, password) {
  const { data, error } = await signInAdmin(email.trim(), password);
  if (error) throw error;

  const role = await getRole(data.user.id);
  if (role !== "admin") {
    await signOut();
    throw new Error("This Supabase account does not have admin privileges.");
  }

  return { type: "admin", user: data.user };
}

export async function loginAsFarmer(identifier, password) {
  const farmer = await authenticateFarmer(identifier.trim(), password);
  if (!farmer) {
    throw new Error("Invalid farmer credentials.");
  }

  if (farmer.status !== "active") {
    throw new Error("This farmer account is inactive.");
  }

  return { type: "farmer", farmer };
}

export async function logout() {
  try {
    await signOut();
  } catch {
    // Farmer sessions are browser-local state only.
  }
  localStorage.removeItem("terrasync_farmer");
}

export async function restoreAdminSession() {
  const { data } = await getSession();
  if (!data.session?.user) return null;

  const role = await getRole(data.session.user.id);
  if (role !== "admin") {
    await signOut();
    return null;
  }

  return { type: "admin", user: data.session.user };
}

export async function getAdminUser() {
  return getCurrentUser();
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChange(callback);
}
