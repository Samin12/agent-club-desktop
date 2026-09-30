import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spin, Typography } from '@arco-design/web-react';
import { Close, Refresh } from '@icon-park/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { isElectronDesktop } from '@renderer/utils/platform';
import styles from './Jarvis.module.css';

const Jarvis: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const exit = () => {
    void navigate(
      returnTo?.startsWith('/') && !returnTo.startsWith('//') && returnTo !== '/jarvis' ? returnTo : '/guid',
      { replace: true }
    );
  };

  useEffect(() => {
    if (!isElectronDesktop()) return;
    void ipcBridge.jarvis.fullscreen.invoke(true).catch(() => {});
    return () => {
      void ipcBridge.jarvis.fullscreen.invoke(false).catch(() => {});
    };
  }, []);
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const desktop = isElectronDesktop();
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!desktop) return;
    let cancelled = false;
    setUrl(undefined);
    setFailed(false);
    void ipcBridge.jarvis.open.invoke().then(
      (result) => {
        if (!cancelled) setUrl(result.url);
      },
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, desktop]);

  return (
    <section className={styles.page} aria-label={t('common.jarvis.title')}>
      <nav className={styles.controls} aria-label={t('common.jarvis.title')}>
        {desktop && (
          <Button
            icon={<Refresh />}
            onClick={reload}
            aria-label={t('common.jarvis.reload')}
            title={t('common.jarvis.reload')}
          />
        )}
        <Button className='flex! items-center! gap-8px!' icon={<Close />} onClick={exit}>
          {t('common.jarvis.exit')}
        </Button>
      </nav>
      {!desktop ? (
        <div className={styles.empty}>{t('common.jarvis.desktopOnly')}</div>
      ) : failed ? (
        <div className={styles.empty} role='alert'>
          <Typography.Text>{t('common.jarvis.failed')}</Typography.Text>
          <Button type='primary' onClick={reload}>
            {t('common.jarvis.retry')}
          </Button>
        </div>
      ) : url ? (
        <iframe
          key={attempt}
          className={styles.frame}
          src={url}
          title={t('common.jarvis.title')}
          allow='microphone; autoplay'
          sandbox='allow-scripts allow-same-origin allow-downloads allow-popups'
          referrerPolicy='no-referrer'
        />
      ) : (
        <div className={styles.empty} role='status'>
          <Spin />
          <Typography.Text>{t('common.jarvis.loading')}</Typography.Text>
        </div>
      )}
    </section>
  );
};

export default Jarvis;
