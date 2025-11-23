'use client';

import React from 'react';
import { useI18n } from '@/contexts';
import { getTranslatedActions } from '@/utils/actions';

interface ActionsSidebarProps {
    onAddStep: (actionType: string) => void;
}

const ActionsSidebar: React.FC<ActionsSidebarProps> = ({ onAddStep }) => {
    const { t } = useI18n();
    const actions = getTranslatedActions(t);

    return (
        <div className="h-full flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] w-64">
            <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <h2 className="font-semibold text-[var(--text-primary)]">
                    {t('testBuilder.actions')}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {t('testBuilder.clickToAdd')}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.type}
                            onClick={() => onAddStep(action.type)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)] hover:shadow-sm transition-all group text-left"
                        >
                            <div
                                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                                style={{
                                    backgroundColor: `${action.color}15`,
                                    color: action.color
                                }}
                            >
                                <Icon size={18} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                    {action.title}
                                </div>
                                <div className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                                    {action.category}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ActionsSidebar;
