'use client';

import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

interface MenuSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function MenuSearchBar({ value, onChange }: MenuSearchBarProps) {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Cari menu..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{ width: '100%', maxWidth: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          sx: {
            minHeight: 48,
            borderRadius: 3,
            bgcolor: 'background.paper',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          },
        }}
      />
    </Box>
  );
}
