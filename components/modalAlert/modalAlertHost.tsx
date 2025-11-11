'use client';

import React, { useEffect, useState } from 'react';
import ModalAlert from './modalAlert';
import { addModalListener } from 'hooks/useModalAlert';

export default function ModalAlertHost() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<React.ReactNode | undefined>(undefined);
  const [message, setMessage] = useState<React.ReactNode | undefined>(undefined);
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  useEffect(() => {
    const unsubscribe = addModalListener((payload) => {
      setTitle(payload.title);
      setMessage(payload.message);
      setType(payload.type || 'error');
      setOpen(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ModalAlert
      open={open}
      title={title}
      message={message}
      type={type}
      onOk={() => setOpen(false)}
    />
  );
}
