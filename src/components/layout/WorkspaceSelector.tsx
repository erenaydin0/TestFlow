"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown, Plus, Box, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

import CreateWorkspaceModal from "../modals/CreateWorkspaceModal";
import { useSettingsModal } from "@/hooks";

interface Workspace {
    id: string;
    name: string;
    role: string;
}

export default function WorkspaceSelector() {
    const { data: session } = useSession();
    const { openSettingsModal } = useSettingsModal();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selected, setSelected] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleOpenWorkspaceSettings = (e: React.MouseEvent, workspaceId: string) => {
        e.preventDefault();
        e.stopPropagation();
        openSettingsModal('workspace', workspaceId);
    };

    useEffect(() => {
        if (session?.user) {
            fetchWorkspaces();
        }
    }, [session]);

    useEffect(() => {
        if (selected) {
            const currentId = localStorage.getItem("selectedWorkspaceId");
            if (currentId !== selected.id) {
                localStorage.setItem("selectedWorkspaceId", selected.id);
                window.location.reload();
            }
        }
    }, [selected]);

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch("/api/workspaces");
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);

                const storedId = localStorage.getItem("selectedWorkspaceId");
                if (storedId) {
                    const storedWorkspace = data.find((w: Workspace) => w.id === storedId);
                    if (storedWorkspace) {
                        setSelected(storedWorkspace);
                        return;
                    }
                }

                if (data.length > 0) {
                    setSelected(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = () => {
        setIsCreateModalOpen(true);
    };

    if (loading) {
        return <div className="h-10 bg-[var(--bg-secondary)] animate-pulse rounded-lg mx-2 mb-4" />;
    }

    return (
        <>
            <div className="px-2 mb-4">
                <Listbox value={selected} onChange={setSelected}>
                    <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[var(--bg-secondary)] py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-[var(--cosmic-orange)] focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <span className="block truncate text-[var(--text-primary)] font-medium">
                                {selected ? selected.name : "Workspace Seç"}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronsUpDown
                                    className="h-4 w-4 text-[var(--text-secondary)]"
                                    aria-hidden="true"
                                />
                            </span>
                        </Listbox.Button>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-[var(--bg-primary)] py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm z-50 border border-[var(--border-primary)] backdrop-blur-xl">
                                {workspaces.map((workspace, workspaceIdx) => (
                                    <Listbox.Option
                                        key={workspaceIdx}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-10 transition-colors ${active ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                            }`
                                        }
                                        value={workspace}
                                    >
                                        {({ selected: isSelected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${isSelected ? "font-medium text-[var(--text-primary)]" : "font-normal"
                                                        }`}
                                                >
                                                    {workspace.name}
                                                </span>
                                                {isSelected ? (
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--cosmic-orange)]">
                                                        <Check className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                ) : (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                                                        <Box className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                )}
                                                {(workspace.role === "OWNER" || workspace.role === "ADMIN") && (
                                                    <button
                                                        onClick={(e) => handleOpenWorkspaceSettings(e, workspace.id)}
                                                        className={`absolute inset-y-0 right-0 flex items-center pr-3 ${active || isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"} hover:text-[var(--cosmic-orange)] transition-colors`}
                                                        title="Workspace Ayarları"
                                                    >
                                                        <Settings className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                                <div className="border-t border-[var(--border-primary)] mt-1 pt-1">
                                    <button
                                        onClick={handleCreateWorkspace}
                                        className="flex w-full items-center px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Yeni Workspace
                                    </button>
                                </div>
                            </Listbox.Options>
                        </Transition>
                    </div>
                </Listbox>
            </div>

            <CreateWorkspaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchWorkspaces}
            />
        </>
    );
}
