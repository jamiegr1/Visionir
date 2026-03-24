"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import type { Role } from "@/lib/permissions";

type RoleCard = {
  role: Role;
  title: string;
  description: string;
  badge: string;
};

const roles: RoleCard[] = [
  {
    role: "creator",
    title: "Creator",
    description:
      "Create and refine governed blocks, then submit them into workflow.",
    badge: "Content creation",
  },
  {
    role: "approver",
    title: "Approver",
    description:
      "Review content, request changes, and approve submissions before publish.",
    badge: "Review workflow",
  },
  {
    role: "admin",
    title: "Admin",
    description:
      "Manage governance, roles, publishing rights, and full platform control.",
    badge: "Full control",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/auth/mock-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to sign in.");
      }

      router.push(json?.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f4f7fb] px-6 py-10 text-slate-900">
      <div className="grid w-full max-w-7xl items-center gap-20 lg:gap-32 xl:gap-40 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <Shield className="h-4 w-4 text-[#4f6fff]" />
              Mock workspace access
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Sign in to the Visionir workspace
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              This mock sign-in flow lets you test governed workflows across
              Creator, Approver, and Admin access before wiring in production
              authentication.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Role-based access",
                "Protected dashboard routes",
                "Workspace-style entry flow",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-sm text-slate-500">
              Mock environment for local development
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#4f6fff]">
                  Choose a role
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Mock sign in
                </h2>
              </div>

              <div className="rounded-2xl bg-[#eef3ff] p-3 text-[#4f6fff]">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {roles.map((item) => {
                const active = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={cx(
                      "w-full rounded-[24px] border p-5 text-left transition",
                      active
                        ? "border-[#cfdcff] bg-[#f7faff] shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.title}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {item.badge}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>

                      <div
                        className={cx(
                          "mt-1 h-5 w-5 rounded-full border-2 transition",
                          active
                            ? "border-[#4f6fff] bg-[#4f6fff]"
                            : "border-slate-300 bg-white"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#0a0c14] px-5 py-4 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : `Continue as ${selectedRole}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}