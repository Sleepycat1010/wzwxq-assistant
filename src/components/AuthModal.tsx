import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cloud } from '../lib/cloud';

type Phase = 'input' | 'code';

/**
 * 登录弹窗：手机号 + 短信验证码登录/注册。
 * 登录后玩家的评分会同步到云端（跨设备）。
 */
export function AuthModal({
  open,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('input');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{
    phone: string;
    verificationId: string;
    isExistingUser: boolean;
  } | null>(null);

  // 弹窗关闭时重置
  const reset = () => {
    setPhase('input');
    setPhone('');
    setCode('');
    setPhoneError('');
    setMessage('');
    setPending(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onPhoneInput = () => setPhoneError('');

  /** 获取验证码：先校验大陆手机号格式，再发送 */
  const sendPhoneCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setPhoneError('请输入正确的 11 位手机号');
      return;
    }
    setPhoneError('');
    setBusy(true);
    setMessage('');
    const sent = await cloud.auth.sendOtp({ phone });
    setBusy(false);
    if (sent.error) {
      setMessage(sent.error.message);
      return;
    }
    setPending({
      phone,
      verificationId: sent.data.verificationId,
      isExistingUser: sent.data.isExistingUser,
    });
    setPhase('code');
  };

  /** 提交验证码登录/注册 */
  const submitPhoneLogin = async () => {
    if (!pending) {
      setMessage('请先获取验证码');
      return;
    }
    if (!code.trim()) {
      setMessage('请输入验证码');
      return;
    }
    setBusy(true);
    setMessage('');
    const completed = await cloud.auth.verifyOtp({
      phone: pending.phone,
      verificationId: pending.verificationId,
      isExistingUser: pending.isExistingUser,
      token: code.trim(),
    });
    setBusy(false);
    if (completed.error) {
      setMessage(completed.error.message);
      return;
    }
    close();
    onSignedIn?.();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="card-base relative z-10 w-full max-w-sm p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-text">
                  登录以同步评分
                </h3>
                <p className="mt-1 text-xs text-text-dim">
                  登录后，你的评分会跨设备同步；不登录也可继续使用（仅保存在本机）
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-2 py-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            {phase === 'input' ? (
              <div className="mt-5">
                <label className="section-label mb-1.5 block">手机号</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onInput={onPhoneInput}
                  placeholder="请输入 11 位手机号"
                  className="w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-text-dim/60 focus:border-gold/50 focus:outline-none"
                />
                {phoneError ? (
                  <p className="mt-1.5 text-xs text-crimson">{phoneError}</p>
                ) : null}

                <button
                  type="button"
                  className="btn-gold mt-4 w-full"
                  onClick={sendPhoneCode}
                  disabled={busy}
                >
                  {busy ? '发送中…' : '获取验证码'}
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <label className="section-label mb-1.5 block">
                  验证码（已发送 {pending?.phone?.slice(0, 3)}****
                  {pending?.phone?.slice(7)}）
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="请输入短信验证码"
                  className="w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-text-dim/60 focus:border-gold/50 focus:outline-none"
                />

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost flex-1"
                    onClick={() => setPhase('input')}
                    disabled={busy}
                  >
                    更换号码
                  </button>
                  <button
                    type="button"
                    className="btn-gold flex-1"
                    onClick={submitPhoneLogin}
                    disabled={busy}
                  >
                    {busy ? '登录中…' : '登录 / 注册'}
                  </button>
                </div>
              </div>
            )}

            {message ? (
              <p className="mt-3 text-center text-xs text-crimson">{message}</p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
