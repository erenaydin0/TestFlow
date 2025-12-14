"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/hooks";

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useI18n();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ 
        name?: string; 
        email?: string; 
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const errors: typeof fieldErrors = {};
        
        if (!name.trim()) {
            errors.name = t('auth.errors.nameRequired');
        } else if (name.trim().length < 2) {
            errors.name = t('auth.errors.nameTooShort');
        }
        
        if (!email.trim()) {
            errors.email = t('auth.errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = t('auth.errors.emailInvalid');
        }
        
        if (!password) {
            errors.password = t('auth.errors.passwordRequired');
        } else if (password.length < 6) {
            errors.password = t('auth.errors.passwordTooShort');
        }
        
        if (!confirmPassword) {
            errors.confirmPassword = t('auth.errors.confirmPasswordRequired');
        } else if (password !== confirmPassword) {
            errors.confirmPassword = t('auth.errors.passwordsDoNotMatch');
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getPasswordStrength = () => {
        if (!password) return null;
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 2) return { level: 'weak', text: t('auth.passwordStrength.weak'), color: '#ef4444' };
        if (strength <= 3) return { level: 'medium', text: t('auth.passwordStrength.medium'), color: '#f59e0b' };
        return { level: 'strong', text: t('auth.passwordStrength.strong'), color: '#22c55e' };
    };

    const passwordStrength = getPasswordStrength();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error codes
                if (data.code === "EMAIL_EXISTS") {
                    setFieldErrors(prev => ({ ...prev, email: t('auth.errors.emailExists') }));
                    setError(t('auth.errors.emailExistsHint'));
                } else if (data.code === "VALIDATION_ERROR" && data.field) {
                    // Set field-specific error
                    setFieldErrors(prev => ({ ...prev, [data.field]: data.message }));
                    setError(data.message);
                } else {
                    setError(data.message || t('auth.errors.unexpectedError'));
                }
                return;
            }

            toast.success(t('auth.registerSuccess'));
            router.push("/login");
        } catch (err) {
            // Network or other errors
            console.error("Register error:", err);
            if (err instanceof TypeError && err.message.includes("fetch")) {
                setError(t('auth.errors.networkError'));
            } else {
                setError(t('auth.errors.unexpectedError'));
            }
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
                            {t('auth.registerTitle')}
                        </h2>
                        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                            {t('auth.registerSubtitle')}
                        </p>
                    </div>

                    {/* Global Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        >
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            {/* Name Field */}
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t('auth.name')}
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors ${
                                        fieldErrors.name 
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-[var(--border-primary)] focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)]'
                                    }`}
                                    placeholder={t('auth.namePlaceholder')}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (fieldErrors.name) {
                                            setFieldErrors(prev => ({ ...prev, name: undefined }));
                                        }
                                        if (error) setError(null);
                                    }}
                                />
                                {fieldErrors.name && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="mb-4">
                                <label htmlFor="email-address" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t('auth.email')}
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors ${
                                        fieldErrors.email 
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-[var(--border-primary)] focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)]'
                                    }`}
                                    placeholder={t('auth.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) {
                                            setFieldErrors(prev => ({ ...prev, email: undefined }));
                                        }
                                        if (error) setError(null);
                                    }}
                                />
                                {fieldErrors.email && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t('auth.password')}
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors ${
                                        fieldErrors.password 
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-[var(--border-primary)] focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)]'
                                    }`}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) {
                                            setFieldErrors(prev => ({ ...prev, password: undefined }));
                                        }
                                        if (error) setError(null);
                                    }}
                                />
                                {fieldErrors.password && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                                )}
                                {/* Password Strength Indicator */}
                                {password && !fieldErrors.password && passwordStrength && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-300"
                                                style={{ 
                                                    width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                                                    backgroundColor: passwordStrength.color 
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs" style={{ color: passwordStrength.color }}>
                                            {passwordStrength.text}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t('auth.confirmPassword')}
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-[var(--text-primary)] rounded-lg focus:outline-none focus:z-10 sm:text-sm bg-[var(--bg-primary)] transition-colors ${
                                        fieldErrors.confirmPassword 
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : confirmPassword && password === confirmPassword
                                                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                                                : 'border-[var(--border-primary)] focus:ring-[var(--cosmic-purple)] focus:border-[var(--cosmic-purple)]'
                                    }`}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (fieldErrors.confirmPassword) {
                                            setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                        }
                                        if (error) setError(null);
                                    }}
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
                                )}
                                {confirmPassword && password === confirmPassword && !fieldErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        {t('auth.passwordsMatch')}
                                    </p>
                                )}
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
                                    t('auth.register')
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center mt-4">
                            <div className="text-sm">
                                <Link href="/login" className="font-medium text-[var(--cosmic-light-purple)] hover:text-[var(--cosmic-purple)] transition-colors">
                                    {t('auth.hasAccount')}
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
