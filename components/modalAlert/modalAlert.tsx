'use client';

import React from 'react';
import { Modal, Alert } from 'antd';

type ModalAlertProps = {
  open: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  onOk?: () => void;
  okText?: string;
  centered?: boolean;
  closable?: boolean;
};


export default function ModalAlert({
  open,
  title,
  message,
  type = 'info',
  onOk,
  okText = 'OK',
  centered = true,
  closable = false,
}: ModalAlertProps) {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onOk}
      okText={okText}
      cancelButtonProps={{ style: { display: 'none' } }}
      centered={centered}
      closable={closable}
    >
      {message && <Alert message={message} type={type} showIcon />}
    </Modal>
  );
}
