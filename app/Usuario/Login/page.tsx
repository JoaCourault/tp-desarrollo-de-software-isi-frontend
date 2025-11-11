'use client';

import { UsuarioApi } from '@/api/usuario.api';

import { Button, Form, Input, Card, Space } from 'antd';
import Title from 'antd/es/typography/Title';
import { showModal } from 'hooks/useModalAlert';

const usuarioApi = new UsuarioApi();

export const Login = () => {
  const handleLogin = async ({ nombre, apellido, password }: { nombre: string; apellido: string; password: string }) => {
    try {
      const response = await usuarioApi.login(nombre, apellido, password);

      if (response?.resultado?.id != 0) {
        showModal({ title: 'Error', message: `Login fallido. ${response?.resultado?.mensaje || ''}`, type: 'error' });
        return;
      }

      showModal({ title: 'Éxito', message: `${response?.resultado?.mensaje || 'Login exitoso'}`, type: 'success' });
    } catch (e) {
      showModal({ title: 'Error', message: (e as Error).message || 'Error inesperado', type: 'error' });
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ width: 420, boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Iniciar Sesión
            </Title>
            <p style={{ margin: 0, color: 'rgba(0,0,0,0.45)' }}>Ingrese sus credenciales para continuar</p>
          </div>

          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Ingresa tu nombre' }]}>
              <Input placeholder="Ingrese su nombre" />
            </Form.Item>

            <Form.Item name="apellido" label="Apellido" rules={[{ required: true, message: 'Ingresa tu apellido' }]}>
              <Input placeholder="Ingrese su apellido" />
            </Form.Item>

            <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
              <Input.Password placeholder="Ingrese su contraseña" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Iniciar Sesión
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Login;