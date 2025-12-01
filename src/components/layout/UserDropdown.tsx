"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import clsx from "clsx";

export default function UserDropdown() {
    const { data: session } = useSession();

    if (!session?.user) {
        return (
            <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                Giriş Yap
            </Link>
        );
    }

    return (
        <Menu as="div" className="relative ml-3">
            <div>
                <Menu.Button className="flex items-center justify-center">
                    <span className="sr-only">Kullanıcı menüsünü aç</span>
                    <div className="h-9 w-9 rounded-full bg-[var(--cosmic-orange)] flex items-center justify-center text-white font-medium shadow-md">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-[var(--bg-primary)] py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--border-primary)] backdrop-blur-xl">
                    <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                        <p className="text-sm text-[var(--text-primary)] font-medium">{session.user.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {session.user.email}
                        </p>
                    </div>
                    <div className="p-1">
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="#"
                                    className={clsx(
                                        active ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                                        "flex items-center px-3 py-2 text-sm rounded-lg transition-colors"
                                    )}
                                >
                                    <User className={clsx("mr-2 h-4 w-4", active ? "text-[var(--cosmic-orange)]" : "text-[var(--text-tertiary)]")} />
                                    Profilim
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }: { active: boolean }) => (
                                <a
                                    href="#"
                                    className={clsx(
                                        active ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                                        "flex items-center px-3 py-2 text-sm rounded-lg transition-colors"
                                    )}
                                >
                                    <Settings className={clsx("mr-2 h-4 w-4", active ? "text-[var(--cosmic-orange)]" : "text-[var(--text-tertiary)]")} />
                                    Ayarlar
                                </a>
                            )}
                        </Menu.Item>
                    </div>
                    <div className="p-1 border-t border-[var(--border-primary)]">
                        <Menu.Item>
                            {({ active }: { active: boolean }) => (
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className={clsx(
                                        active ? "bg-red-500/10 text-red-400" : "text-red-400",
                                        "flex w-full items-center px-3 py-2 text-sm rounded-lg transition-colors"
                                    )}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Çıkış Yap
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
