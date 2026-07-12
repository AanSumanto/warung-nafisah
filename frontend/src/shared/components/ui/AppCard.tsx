import Card, { type CardProps } from '@mui/material/Card';
import CardActions, { type CardActionsProps } from '@mui/material/CardActions';
import CardContent, { type CardContentProps } from '@mui/material/CardContent';
import CardHeader, { type CardHeaderProps } from '@mui/material/CardHeader';

export interface AppCardProps extends CardProps {
  readonly header?: CardHeaderProps;
  readonly contentProps?: CardContentProps;
  readonly actions?: CardActionsProps;
  readonly actionsContent?: React.ReactNode;
}

export function AppCard({
  header,
  children,
  contentProps,
  actions,
  actionsContent,
  ...cardProps
}: AppCardProps) {
  return (
    <Card {...cardProps}>
      {header ? <CardHeader {...header} /> : null}
      <CardContent {...contentProps}>{children}</CardContent>
      {actionsContent ? <CardActions {...actions}>{actionsContent}</CardActions> : null}
    </Card>
  );
}
