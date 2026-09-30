import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spin, Typography } from '@arco-design/web-react';
import { Refresh } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { isElectronDesktop } from '@renderer/utils/platform';
import styles from './Jarvis.module.css';

const Jarvis: React.FC = () => {
  const { t } = useTranslation();
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
      <header className={styles.header}>
        <div>
          <Typography.Title heading={5} className='m-0!'>
            {t('common.jarvis.title')}
          </Typography.Title>
          <Typography.Text type='secondary'>{t('common.jarvis.subtitle')}</Typography.Text>
        </div>
        {desktop && (
          <Button
            className='flex! items-center! gap-8px!'
            icon={<Refresh />}
            onClick={reload}
            aria-label={t('common.jarvis.reload')}
          >
            {t('common.jarvis.reload')}
          </Button>
        )}
      </header>
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
