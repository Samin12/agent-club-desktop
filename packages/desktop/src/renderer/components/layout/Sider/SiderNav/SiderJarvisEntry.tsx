import React from 'react';
import { Button, Tooltip } from '@arco-design/web-react';
import { Voice } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

type Props = {
  collapsed: boolean;
  isActive: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
};

const SiderJarvisEntry: React.FC<Props> = ({ collapsed, isActive, siderTooltipProps, onClick }) => {
  const { t } = useTranslation();
  return (
    <Tooltip {...siderTooltipProps} content={t('common.jarvis.title')} position='right'>
      <Button
        type='text'
        long
        icon={<Voice size={collapsed ? 20 : 16} />}
        className={classNames(
          'h-34px! text-t-primary! rd-8px! flex! items-center! gap-8px!',
          collapsed ? 'justify-center!' : 'justify-start! px-12px!',
          isActive && 'bg-fill-3!'
        )}
        aria-label={t('common.jarvis.title')}
        aria-current={isActive ? 'page' : undefined}
        onClick={onClick}
      >
        {!collapsed && t('common.jarvis.title')}
      </Button>
    </Tooltip>
  );
};

export default SiderJarvisEntry;
