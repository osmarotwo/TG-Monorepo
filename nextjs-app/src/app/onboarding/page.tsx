"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Logo } from "@/components/Logo";
import type { ChangeEvent, FormEvent } from "react";

// Componente de completar perfil que obtiene el usuario del contexto
export default function ProfileCompletion() {
  const { user, logout, completeProfile } = useAuth(); // Obtener completeProfile del contexto
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    birthDate: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    // Prediligenciar formulario con datos del usuario (incluyendo Google)
    if (user) {
      // Construir fullName desde firstName y lastName
      const fullName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || "";
      
      setForm({
        fullName: fullName,
        email: user.email || "",
        birthDate: user.birthDate || "",
        gender: "", // gender no viene del backend, usuario debe seleccionarlo
      });
    }
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Validaciones básicas
    if (!form.fullName || !form.email || !form.birthDate || !form.gender) {
      setError(t("allFieldsRequired", "onboarding"));
      setLoading(false);
      return;
    }
    try {
      // Usar completeProfile del AuthContext que maneja el token automáticamente
      await completeProfile({
        phone: '', // Opcional
        birthDate: form.birthDate,
        profileCompleted: true,
      });
      
      // Redirigir al dashboard - el perfil está completo
      // AuthenticatedApp manejará la redirección automáticamente
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : t("connectionError", "auth"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="max-w-md w-full">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("completeProfile", "onboarding")}
            </h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                {t("fullName", "auth")}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t("fullNamePlaceholder", "auth")}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t("email", "auth")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t("emailPlaceholder", "auth")}
              />
            </div>
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                {t("birthDate", "auth")}
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("gender", "auth")}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={form.gender === "male"}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t("male", "auth")}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={form.gender === "female"}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t("female", "auth")}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="prefer-not-to-say"
                    checked={form.gender === "prefer-not-to-say"}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t("preferNotToSay", "auth")}</span>
                </label>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("saving", "onboarding") : t("completeProfile", "onboarding")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
