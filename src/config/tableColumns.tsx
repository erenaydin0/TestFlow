'use client';

import React from 'react';
import { Column } from '@/components/common/DataTable';
import { TableCells, EditableSuiteCell, EditableTagsCell, EditableBrowserCell } from '@/components/common';
import { Test, ExecutionResult, ScheduledTest, BrowserType } from '@/types';
import { formatRelativeTime, formatDateForTooltip } from '@/utils/utils';
import { useI18n } from '@/hooks';

const { BrowserCell, TagsCell, ActionsCell, StepCountCell, TestNameCell, StatusCell, DurationCell, SuccessRateCell, ScheduleCell, NextRunCell, ScheduledActionsCell } = TableCells;

/**
 * Tests sayfası için tablo kolonları
 */
export const getTestsTableColumns = (
  t: (key: string, params?: any) => string,
  filterOptions: { suites: string[]; tags: string[]; browsers: string[] },
  handlers: {
    onUpdateSuite: (testId: string, suite: string) => void;
    onUpdateTags: (testId: string, tags: string[]) => void;
    onUpdateBrowser: (testId: string, browserType: any) => void;
    onRun: (testId: string) => void;
    onEdit: (testId: string) => void;
    onDuplicate: (testId: string) => void;
    onExport: (testId: string) => void;
    onDelete: (testId: string) => void;
  }
): Column<Test>[] => [
    {
      key: 'name',
      label: t('tests.testName'),
      sortable: true,
      width: '300px',
      render: (value, test) => (
        <TestNameCell
          name={test.name}
          description={test.description}
          id={test.id}
        />
      )
    },
    {
      key: 'suite',
      label: t('tests.testGroup'),
      sortable: true,
      width: '150px',
      render: (value, test) => (
        <EditableSuiteCell
          value={value}
          testId={test.id}
          availableSuites={filterOptions.suites}
          onUpdate={handlers.onUpdateSuite}
        />
      )
    },
    {
      key: 'tags',
      label: t('tests.tags'),
      sortable: true,
      width: '200px',
      render: (value, test) => (
        <EditableTagsCell
          tags={test.tags}
          testId={test.id}
          availableTags={filterOptions.tags}
          onUpdate={handlers.onUpdateTags}
        />
      )
    },
    {
      key: 'browserType',
      label: t('tests.browser'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <EditableBrowserCell
          browserType={test.browserType || 'chromium'}
          testId={test.id}
          onUpdate={handlers.onUpdateBrowser}
        />
      )
    },
    {
      key: 'stepCount',
      label: t('tests.stepCount'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <StepCountCell count={test.workflow?.length || 0} />
      )
    },
    {
      key: 'createdAt',
      label: t('tests.createdAt'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {test.createdAt ? new Date(test.createdAt).toLocaleDateString('tr-TR') : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('tests.actions'),
      sortable: false,
      width: '200px',
      render: (value, test) => (
        <ActionsCell
          onRun={() => handlers.onRun(test.id)}
          onEdit={() => handlers.onEdit(test.id)}
          onDuplicate={() => handlers.onDuplicate(test.id)}
          onExport={() => handlers.onExport(test.id)}
          onDelete={() => handlers.onDelete(test.id)}
        />
      )
    }
  ];

/**
 * Reports sayfası için tablo kolonları
 */
export const getReportsTableColumns = (
  t: (key: string, params?: any) => string,
  locale: string,
  handlers: {
    onDownload: (execution: ExecutionResult) => void;
  }
): Column<ExecutionResult>[] => [
    {
      key: 'workflowName',
      label: t('reports.testName'),
      sortable: true,
      render: (value, execution) => (
        <TestNameCell
          name={execution.workflowName}
          id={execution.id}
        />
      )
    },
    {
      key: 'status',
      label: t('reports.status'),
      sortable: true,
      width: '80px',
      render: (value, execution) => (
        <StatusCell status={execution.status} size="sm" />
      )
    },
    {
      key: 'successRate',
      label: t('reports.success'),
      sortable: true,
      width: '90px',
      render: (value, execution) => (
        <SuccessRateCell rate={execution.successRate} />
      )
    },
    {
      key: 'startTime',
      label: t('reports.startTime'),
      sortable: true,
      width: '140px',
      responsiveClass: 'hide-on-tablet',
      render: (value, execution) => {
        const fullDateTime = formatDateForTooltip(execution.startTime, locale);

        return (
          <span
            style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            title={fullDateTime}
          >
            {formatRelativeTime(execution.startTime, t)}
          </span>
        );
      }
    },
    {
      key: 'duration',
      label: t('reports.duration'),
      sortable: true,
      align: 'center',
      width: '90px',
      responsiveClass: 'hide-on-small-desktop',
      render: (value, execution) => (
        <DurationCell duration={execution.duration} />
      )
    },
    {
      key: 'suite',
      label: t('reports.testGroup'),
      width: '150px',
      sortable: true,
      responsiveClass: 'hide-on-small-desktop',
      render: (value) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'tags',
      label: t('reports.tags'),
      sortable: true,
      width: '200px',
      responsiveClass: 'hide-on-small-desktop',
      render: (value, execution) => (
        <TagsCell tags={execution.tags || []} maxVisible={2} />
      )
    },
    {
      key: 'browserType',
      label: t('reports.browser'),
      sortable: true,
      align: 'center',
      width: '100px',
      responsiveClass: 'hide-on-small-desktop',
      render: (value, execution) => (
        <BrowserCell browserType={execution.options?.browserType} />
      )
    },
    {
      key: 'actions',
      label: t('reports.downloadReport'),
      sortable: false,
      width: '80px',
      align: 'center',
      render: (value, execution) => (
        <ActionsCell
          onDownload={() => handlers.onDownload(execution)}
        />
      )
    }
  ];

/**
 * Scheduled sayfası için tablo kolonları
 */
export const getScheduledTableColumns = (
  t: (key: string, params?: any) => string,
  getScheduleDescription: (schedule: any, t: any) => string,
  handlers: {
    onToggle: (id: string) => void;
    onEdit: (schedule: ScheduledTest) => void;
    onDelete: (schedule: ScheduledTest) => void;
  }
): Column<ScheduledTest>[] => [
    {
      key: 'name',
      label: t('scheduled.testName'),
      sortable: true,
      width: '300px',
      render: (value: any, schedule: ScheduledTest) => (
        <TestNameCell
          name={schedule.name}
          description={schedule.description}
          id={schedule.id}
        />
      )
    },
    {
      key: 'status',
      label: t('scheduled.status'),
      sortable: true,
      width: '120px',
      render: (value: any, schedule: ScheduledTest) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: schedule.status === 'active' ? 'var(--status-success)' : 'var(--status-error)',
        }}>
          {schedule.status === 'active' ? t('scheduled.active') : t('scheduled.inactive')}
        </div>
      )
    },
    {
      key: 'schedule',
      label: t('scheduled.schedule'),
      sortable: true,
      width: '200px',
      render: (value: any, schedule: ScheduledTest) => (
        <ScheduleCell
          schedule={schedule.schedule}
          description={getScheduleDescription(schedule.schedule, t)}
        />
      )
    },
    {
      key: 'nextRun',
      label: t('scheduled.nextRun'),
      sortable: true,
      width: '200px',
      render: (value: any, schedule: ScheduledTest) => (
        <NextRunCell nextRun={schedule.nextRun} />
      )
    },
    {
      key: 'actions',
      label: t('scheduled.actions'),
      sortable: false,
      width: '150px',
      render: (value: any, schedule: ScheduledTest) => (
        <ScheduledActionsCell
          onToggle={() => handlers.onToggle(schedule.id)}
          onEdit={() => handlers.onEdit(schedule)}
          onDelete={() => handlers.onDelete(schedule)}
          status={schedule.status === 'active' ? 'active' : 'inactive'}
        />
      )
    }
  ];
