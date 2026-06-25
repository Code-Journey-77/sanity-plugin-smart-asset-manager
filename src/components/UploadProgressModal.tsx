import React from 'react'
import {Box, Card, Text, Flex, Stack, Button, Badge} from '@sanity/ui'
import {CloseIcon} from '@sanity/icons'
import styled, {keyframes, css} from 'styled-components'

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'skipped'

export interface FileUploadItem {
  name: string
  size: number
  percent: number
  status: FileUploadStatus
  error?: string
}

interface UploadProgressModalProps {
  items: FileUploadItem[]
  onCancelFile: (name: string) => void
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`

const shimmerMove = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
`

// ─── Layout (uses Sanity CSS vars for colors) ─────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  /* Sanity uses a very subtle overlay in its own dialogs */
  background: var(--card-shadow-outline-color, rgba(0, 0, 0, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`

const ModalShell = styled(Card)`
  width: 540px;
  max-width: 100%;
  border-radius: var(--radius-3, 8px);
  overflow: hidden;
  border: 1px solid var(--card-border-color);
  animation: ${fadeIn} 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
`

// ─── Overall progress bar (CSS-var themed) ────────────────────────────────────

const OverallTrack = styled.div`
  height: 4px;
  border-radius: 999px;
  background: var(--card-border-color);
  overflow: hidden;
`

const OverallFill = styled.div<{$pct: number; $allDone: boolean}>`
  height: 100%;
  border-radius: 999px;
  width: ${({$pct}) => $pct}%;
  transition: width 0.4s ease;
  background: ${({$allDone}) =>
    $allDone
      ? 'var(--green-500, #22c55e)'
      : 'linear-gradient(90deg, var(--purple-500,#8b5cf6) 0%, var(--blue-400,#60a5fa) 50%, var(--purple-500,#8b5cf6) 100%)'};
  background-size: 300% auto;
  ${({$allDone}) =>
    !$allDone &&
    css`
      animation: ${shimmerMove} 1.8s linear infinite;
    `}
`

// ─── Per-file track ───────────────────────────────────────────────────────────

const FileTrack = styled.div`
  height: 3px;
  border-radius: 999px;
  background: var(--card-border-color);
  overflow: hidden;
  margin-top: 6px;
`

const FileFill = styled.div<{$pct: number; $status: FileUploadStatus}>`
  height: 100%;
  border-radius: 999px;
  width: ${({$pct}) => $pct}%;
  transition: width 0.25s ease;

  ${({$status}) =>
    $status === 'done' &&
    css`
      background: var(--green-500, #22c55e);
    `}
  ${({$status}) =>
    $status === 'error' &&
    css`
      background: var(--red-500, #ef4444);
    `}
  ${({$status}) =>
    $status === 'skipped' &&
    css`
      background: var(--yellow-500, #f59e0b);
    `}
  ${({$status}) =>
    $status === 'pending' &&
    css`
      background: var(--card-muted-fg-color);
    `}
  ${({$status}) =>
    $status === 'uploading' &&
    css`
      background: linear-gradient(
        90deg,
        var(--purple-500, #8b5cf6) 0%,
        var(--blue-400, #60a5fa) 50%,
        var(--purple-500, #8b5cf6) 100%
      );
      background-size: 300% auto;
      animation: ${shimmerMove} 1.5s linear infinite;
    `}
`

// ─── File row separator ───────────────────────────────────────────────────────

const FileRow = styled(Box)`
  border-bottom: 1px solid var(--card-border-color);
  &:last-child {
    border-bottom: none;
  }
`

const FileName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--card-fg-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
`

const PercentLabel = styled.span<{$status: FileUploadStatus}>`
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  text-align: right;
  color: ${({$status}) => {
    if ($status === 'done') return 'var(--green-500, #22c55e)'
    if ($status === 'error') return 'var(--red-500, #ef4444)'
    if ($status === 'skipped') return 'var(--yellow-500, #f59e0b)'
    if ($status === 'uploading') return 'var(--purple-400, #a78bfa)'
    return 'var(--card-muted-fg-color)'
  }};
`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusTone(
  status: FileUploadStatus,
): 'positive' | 'critical' | 'caution' | 'primary' | 'default' {
  if (status === 'done') return 'positive'
  if (status === 'error') return 'critical'
  if (status === 'skipped') return 'caution'
  if (status === 'uploading') return 'primary'
  return 'default'
}

function statusLabel(status: FileUploadStatus): string {
  if (status === 'done') return 'Done'
  if (status === 'error') return 'Failed'
  if (status === 'skipped') return 'Skipped'
  if (status === 'uploading') return 'Uploading'
  return 'Waiting'
}

// ─── Component ───────────────────────────────────────────────────────────────

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({items, onCancelFile}) => {
  if (items.length === 0) return null

  const finishedCount = items.filter(
    (i) => i.status === 'done' || i.status === 'error' || i.status === 'skipped',
  ).length
  const errorCount = items.filter((i) => i.status === 'error').length
  const isAllDone = finishedCount === items.length
  const overallPct = items.length === 0 ? 0 : Math.round((finishedCount / items.length) * 100)

  const bytesUploaded = items.reduce((acc, i) => acc + i.size * (i.percent / 100), 0)
  const bytesTotal = items.reduce((acc, i) => acc + i.size, 0)

  return (
    <Backdrop>
      <ModalShell radius={3}>
        {/* ── Header ── */}
        <Box padding={4} style={{borderBottom: '1px solid var(--card-border-color)'}}>
          <Stack space={3}>
            <Flex align="center" justify="space-between">
              <Text size={2} weight="semibold">
                {isAllDone ? '✓ Upload Complete' : 'Uploading Files'}
              </Text>
              <Text size={1} muted>
                {finishedCount} / {items.length} files
                {errorCount > 0 ? ` · ${errorCount} failed` : ''}
              </Text>
            </Flex>

            {/* Overall bar */}
            <OverallTrack>
              <OverallFill $pct={overallPct} $allDone={isAllDone} />
            </OverallTrack>

            <Flex align="center" justify="space-between">
              <Text size={0} muted>
                {formatSize(bytesUploaded)} / {formatSize(bytesTotal)}
              </Text>
              <Text size={0} muted>
                {overallPct}%
              </Text>
            </Flex>
          </Stack>
        </Box>

        {/* ── File List ── */}
        <Box style={{maxHeight: 380, overflowY: 'auto'}}>
          {items.map((item) => {
            const canCancel = item.status === 'pending' || item.status === 'uploading'
            const displayPct =
              item.status === 'done'
                ? '100%'
                : item.status === 'error'
                  ? 'ERR'
                  : item.status === 'skipped'
                    ? '—'
                    : `${item.percent}%`

            return (
              <FileRow key={item.name} padding={3}>
                {/* Row 1: name + badge + % + cancel */}
                <Flex align="center" gap={2} style={{marginBottom: 6}}>
                  <FileName title={item.name}>{item.name}</FileName>

                  {/* Status badge */}
                  <Badge tone={statusTone(item.status)} fontSize={0} padding={2}>
                    {statusLabel(item.status)}
                  </Badge>

                  {/* File size */}
                  <Text size={0} muted style={{flexShrink: 0}}>
                    {formatSize(item.size)}
                  </Text>

                  {/* Percent */}
                  <PercentLabel $status={item.status}>{displayPct}</PercentLabel>

                  {/* Per-file cancel — only visible while pending/uploading */}
                  {canCancel && (
                    <Button
                      aria-label={`Cancel upload for ${item.name}`}
                      icon={CloseIcon}
                      mode="bleed"
                      tone="critical"
                      padding={1}
                      fontSize={1}
                      title="Cancel this file"
                      onClick={() => onCancelFile(item.name)}
                      style={{flexShrink: 0}}
                    />
                  )}
                </Flex>

                {/* Row 2: per-file progress bar */}
                <FileTrack>
                  <FileFill
                    $pct={item.status === 'done' ? 100 : item.percent}
                    $status={item.status}
                  />
                </FileTrack>

                {/* Error detail */}
                {item.status === 'error' && item.error && (
                  <Box marginTop={1}>
                    <Text size={0} style={{color: 'var(--red-400, #f87171)'}}>
                      {item.error}
                    </Text>
                  </Box>
                )}
              </FileRow>
            )
          })}
        </Box>
      </ModalShell>
    </Backdrop>
  )
}
