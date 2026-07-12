'use client';

import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions, { type DialogActionsProps } from '@mui/material/DialogActions';
import DialogContent, { type DialogContentProps } from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

export interface AppDialogProps extends Omit<DialogProps, 'title'> {
  readonly title?: React.ReactNode;
  readonly contentProps?: DialogContentProps;
  readonly actions?: DialogActionsProps;
  readonly actionsContent?: React.ReactNode;
}

export function AppDialog({
  title,
  children,
  contentProps,
  actions,
  actionsContent,
  ...dialogProps
}: AppDialogProps) {
  return (
    <Dialog fullWidth maxWidth="sm" {...dialogProps}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent {...contentProps}>{children}</DialogContent>
      {actionsContent ? <DialogActions {...actions}>{actionsContent}</DialogActions> : null}
    </Dialog>
  );
}
