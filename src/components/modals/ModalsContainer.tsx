import React from 'react';
import { QrCodeModal } from './QrCodeModal';
import { InspectPhotoModal } from './InspectPhotoModal';
import { NegotiateModal } from './NegotiateModal';
import { ImageEnhancerModal } from './ImageEnhancerModal';
import { AutoCatalogerModal } from './AutoCatalogerModal';
import { PricingAssistantModal } from './PricingAssistantModal';
import { EditProductModal } from './EditProductModal';

export const ModalsContainer: React.FC = () => {
  return (
    <>
      <QrCodeModal />
      <InspectPhotoModal />
      <NegotiateModal />
      <ImageEnhancerModal />
      <AutoCatalogerModal />
      <PricingAssistantModal />
      <EditProductModal />
    </>
  );
};
