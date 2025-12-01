"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                toast.error("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
            } else {
                toast.success("Giriş başarılı!");
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Cosmic Background Animations */}
            <div className="cosmic-background">
                {/* Floating particles */}
                <div className="cosmic-particle" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
                <div className="cosmic-particle" style={{ left: '80%', top: '40%', animationDelay: '2s' }} />
                <div className="cosmic-particle" style={{ left: '30%', top: '60%', animationDelay: '4s' }} />
                <div className="cosmic-particle" style={{ left: '70%', top: '80%', animationDelay: '6s' }} />
                <div className="cosmic-particle" style={{ left: '50%', top: '30%', animationDelay: '3s' }} />
                <div className="cosmic-particle" style={{ left: '20%', top: '70%', animationDelay: '5s' }} />

                {/* Nebula clouds */}
                <div className="nebula-cloud nebula-cloud-1" />
                <div className="nebula-cloud nebula-cloud-2" />
                <div className="nebula-cloud nebula-cloud-3" />
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="card p-8 backdrop-blur-xl bg-opacity-80 border border-[var(--border-primary)] shadow-2xl">
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-20 h-20 bg-[var(--bg-primary)] rounded-full flex items-center justify-center mb-4 shadow-lg border border-[var(--border-primary)]"
                        >
                            <Image src="/icon.svg" alt="CosmicQA Logo" width={40} height={40} className="w-10 h-10" />
                        </motion.div>
                        <h2 className="mt-2 text-center text-3xl font-extrabold text-[var(--text-primary)]">
                            CosmicQA
                        </h2>
                        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                            Test otomasyonunda yeni bir evren
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="mb-4">
                                <label htmlFor="email-address" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Email Adresi
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-[var(--border-primary)] placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)] focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors"
                                    placeholder="ornek@sirket.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Şifre
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-[var(--border-primary)] placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)] focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="cosmic-button group relative w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    "Giriş Yap"
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center mt-4">
                            <div className="text-sm">
                                <Link href="/register" className="font-medium text-[var(--cosmic-light-purple)] hover:text-[var(--cosmic-purple)] transition-colors">
                                    Hesabınız yok mu? Kayıt olun
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
