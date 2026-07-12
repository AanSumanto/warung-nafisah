'use client';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useState } from 'react';

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

export function PasswordField({ InputProps, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setVisible((current) => !current)}
              onMouseDown={(event) => event.preventDefault()}
              edge="end"
            >
              {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
