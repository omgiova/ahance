import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { setAdminPassword } from '@/lib/adminAuth';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'https://ahance.onrender.com').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

export default function AdminLogin({ redirectPath = '/admin' }) {
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      toast.error('Digite a senha do painel');
      return;
    }

    setLoading(true);
    try {
      await axios.get(`${API}/admin/auth-check`, {
        headers: {
          'x-admin-password': trimmedPassword,
        },
      });

      setAdminPassword(trimmedPassword);
      toast.success('Acesso liberado');
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Senha inválida');
      } else {
        toast.error('Não foi possível validar a senha');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffeec] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 border border-black/10 rounded-3xl p-8 shadow-sm"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#e38e4d]/20 mx-auto mb-5">
          <LockKeyhole className="w-6 h-6 text-[#674011]" />
        </div>

        <h1
          className="text-3xl text-center text-black mb-2"
          style={{ fontFamily: 'EB Garamond, serif' }}
        >
          Área Administrativa
        </h1>

        <p
          className="text-center text-black/60 mb-6"
          style={{ fontFamily: 'EB Garamond, serif' }}
        >
          Digite a senha cadastrada no Render para entrar no painel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder="Senha do admin"
            autoFocus
            className="bg-white border-black/20 text-black focus-visible:ring-1 focus-visible:ring-[#e38e4d]"
            style={{ fontFamily: 'EB Garamond, serif' }}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-full"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            {loading ? 'Validando...' : 'Entrar'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
