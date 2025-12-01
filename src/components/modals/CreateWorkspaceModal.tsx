"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSidebar } from "../../hooks/useSidebar";

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateWorkspaceModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateWorkspaceModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { setIsModalOpen } = useSidebar();

    useEffect(() => {
        setIsModalOpen(isOpen);
    }, [isOpen, setIsModalOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Workspace oluşturulamadı");
            }

            toast.success("Workspace başarıyla oluşturuldu!");
            onSuccess();
            onClose();
            setName("");
            setDescription("");
            router.refresh();
        } catch (error: any) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 text-left align-middle shadow-2xl transition-all backdrop-blur-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-[var(--text-primary)]"
                                    >
                                        Yeni Workspace Oluştur
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                                        >
                                            Workspace Adı
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="block w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2.5 text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--cosmic-purple)] focus:ring-[var(--cosmic-purple)] sm:text-sm focus:outline-none transition-colors"
                                            placeholder="Örn: Takım A Projeleri"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="description"
                                            className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                                        >
                                            Açıklama (İsteğe bağlı)
                                        </label>
                                        <textarea
                                            id="description"
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="block w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2.5 text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--cosmic-purple)] focus:ring-[var(--cosmic-purple)] sm:text-sm focus:outline-none transition-colors"
                                            placeholder="Bu workspace ne için kullanılacak?"
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-lg border border-[var(--border-primary)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:ring-offset-2 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="cosmic-button inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Oluşturuluyor...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Oluştur
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
